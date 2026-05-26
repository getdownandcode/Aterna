import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(rawBody);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign"]
  );

  const sigBuffer = await crypto.subtle.sign("HMAC", key, msgData);
  const sigArray = Array.from(new Uint8Array(sigBuffer));
  const expectedSignature = sigArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return expectedSignature === signature;
}

serve(async (req) => {
  try {
    const signature = req.headers.get("X-Razorpay-Signature");
    if (!signature) {
      console.warn("[razorpay-webhook] Missing X-Razorpay-Signature header.");
      return new Response("Invalid signature", { status: 400 });
    }

    const rawBody = await req.text(); // Read raw text body for signature verification
    const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET") ?? "";

    const isSignatureValid = await verifyWebhookSignature(rawBody, signature, secret);
    if (!isSignatureValid) {
      console.warn("[razorpay-webhook] Webhook signature verification failed.");
      return new Response("Invalid signature", { status: 400 });
    }

    // Parse JSON after cryptographic validation is complete
    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const eventEntity = payload.payload?.payment?.entity || payload.payload?.refund?.entity;

    if (!eventEntity) {
      console.log("[razorpay-webhook] Unhandled payload structure, acknowledging anyway.");
      return new Response("Event acknowledged", { status: 200 });
    }

    const paymentId = eventEntity.payment_id || eventEntity.id;
    console.log(`[razorpay-webhook] Processing event ${event} for payment ${paymentId}`);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Handle webhook events
    if (event === "payment.authorized") {
      const { error } = await supabaseAdmin
        .from("commitments")
        .update({ razorpay_status: "authorized" })
        .eq("razorpay_payment_id", paymentId);

      if (error) console.error("[razorpay-webhook] DB update failed for payment.authorized:", error);
    } else if (event === "payment.captured") {
      const { error } = await supabaseAdmin
        .from("commitments")
        .update({ razorpay_status: "captured" })
        .eq("razorpay_payment_id", paymentId);

      if (error) console.error("[razorpay-webhook] DB update failed for payment.captured:", error);
    } else if (event === "refund.processed") {
      const { error } = await supabaseAdmin
        .from("commitments")
        .update({ razorpay_status: "refunded" })
        .eq("razorpay_payment_id", paymentId);

      if (error) console.error("[razorpay-webhook] DB update failed for refund.processed:", error);
    } else if (event === "payment.failed") {
      // payment failed, fetch commitment to get the goal ID and void the goal contract
      const { data: commitment } = await supabaseAdmin
        .from("commitments")
        .select("id, goal_id")
        .eq("razorpay_payment_id", paymentId)
        .maybeSingle();

      if (commitment) {
        // Update commitment to failed
        await supabaseAdmin
          .from("commitments")
          .update({
            status: "payment_failed",
            razorpay_status: "failed",
          })
          .eq("id", commitment.id);

        // Cancel the goal
        await supabaseAdmin
          .from("goals")
          .update({ status: "cancelled" })
          .eq("id", commitment.goal_id);

        console.log(`[razorpay-webhook] Voided goal ${commitment.goal_id} due to failed authorization.`);
      }
    }

    // Always return 200 OK to Razorpay to prevent repeat retries
    return new Response("Event processed successfully", { status: 200 });
  } catch (err) {
    console.error("[razorpay-webhook] Webhook handler error:", err);
    // Return 200 OK anyway to prevent Razorpay from spamming retries
    return new Response("Internal server error acknowledged", { status: 200 });
  }
});
