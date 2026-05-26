import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized user credentials" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { goalId, outcome } = await req.json();
    if (!goalId || !outcome || !["completed", "partial", "failed"].includes(outcome)) {
      return new Response(JSON.stringify({ error: "Invalid resolution parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Fetch commitment with service role to prevent user manipulation
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: commitment, error: commitmentError } = await supabaseAdmin
      .from("commitments")
      .select("*")
      .eq("goal_id", goalId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (commitmentError || !commitment) {
      return new Response(JSON.stringify({ error: "Commitment ledger record not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. IDEMPOTENCY CHECK: If already resolved, return 409 conflict
    if (commitment.status !== "held") {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Commitment already resolved",
          status: commitment.status,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const paymentId = commitment.razorpay_payment_id;
    if (!paymentId) {
      return new Response(JSON.stringify({ error: "Razorpay payment reference missing" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const amountRupees = parseFloat(commitment.amount);
    const amountPaise = Math.round(amountRupees * 100);

    const keyId = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";
    const base64Auth = btoa(`${keyId}:${keySecret}`);

    let amountCaptured = 0;
    let amountRefunded = 0;
    let nextStatus = "held";
    let razorpayStatus = "authorized";

    // 3. Process resolution logic based on goal outcome
    if (outcome === "completed") {
      // Done ✓: Refund the full authorized payment (release hold)
      console.log(`[resolve-payment] Refunding ₹${amountRupees} fully for payment: ${paymentId}`);
      const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${base64Auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: amountPaise, speed: "optimum" }),
      });

      if (!res.ok) {
        const errData = await res.json();
        console.error("[resolve-payment] Razorpay Refund failed:", errData);
        return new Response(JSON.stringify({ error: "Failed to release secure hold on Razorpay." }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      amountRefunded = amountRupees;
      nextStatus = "released_success";
      razorpayStatus = "refunded";
    } else if (outcome === "partial") {
      // Partial ≈: Capture 50%, refund remaining 50%
      const halfPaiseCapture = Math.floor(amountPaise * 0.5);
      const halfPaiseRefund = Math.ceil(amountPaise * 0.5);

      console.log(`[resolve-payment] Partial: Capturing ₹${halfPaiseCapture / 100} and refunding ₹${halfPaiseRefund / 100}`);
      
      // Capture first
      const captureRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/capture`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${base64Auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: halfPaiseCapture, currency: "INR" }),
      });

      if (!captureRes.ok) {
        const errData = await captureRes.json();
        console.error("[resolve-payment] Razorpay Partial Capture failed:", errData);
        return new Response(JSON.stringify({ error: "Failed to capture partial funds." }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Refund the remaining 50% hold
      const refundRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${base64Auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: halfPaiseRefund, speed: "optimum" }),
      });

      if (!refundRes.ok) {
        const errData = await refundRes.json();
        console.error("[resolve-payment] Razorpay Partial Refund failed:", errData);
        // Note: Captured already completed, but log refund warning
      }

      amountCaptured = halfPaiseCapture / 100;
      amountRefunded = halfPaiseRefund / 100;
      nextStatus = "partial";
      razorpayStatus = "captured";
    } else if (outcome === "failed") {
      // Failed ✕: Capture 100% of the funds
      console.log(`[resolve-payment] Capturing ₹${amountRupees} fully for failed check-in`);
      const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/capture`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${base64Auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: amountPaise, currency: "INR" }),
      });

      if (!res.ok) {
        const errData = await res.json();
        console.error("[resolve-payment] Razorpay Capture failed:", errData);
        return new Response(JSON.stringify({ error: "Failed to capture penalty funds on Razorpay." }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      amountCaptured = amountRupees;
      nextStatus = "transferred_fail";
      razorpayStatus = "captured";
    }

    // 4. Update the DB commitments ledger securely
    const { error: updateError } = await supabaseAdmin
      .from("commitments")
      .update({
        status: nextStatus,
        razorpay_status: razorpayStatus,
        consequence_triggered_at: new Date().toISOString(),
      })
      .eq("id", commitment.id);

    if (updateError) {
      console.error("[resolve-payment] Failed to update commitments table:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        amountCaptured,
        amountRefunded,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[resolve-payment] Critical error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
