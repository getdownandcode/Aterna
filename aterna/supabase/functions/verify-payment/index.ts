import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const data = `${orderId}|${paymentId}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(data);

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

    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      rawText,
      smartText,
      category,
      stakeAmount,
      consequenceType,
      consequenceTarget,
      goalDate,
    } = body;

    // 1. Verify Razorpay cryptographic signature
    const secret = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";
    const isSignatureValid = await verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      secret
    );

    if (!isSignatureValid) {
      console.warn(`[verify-payment] FRAUD ATTEMPT: Invalid signature detected for order ${razorpay_order_id}`);
      return new Response(JSON.stringify({ error: "Payment verification signature mismatch." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Perform server-side validation of goal details
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: dbUser } = await supabaseAdmin
      .from("users")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();

    const maxAllowed = dbUser?.subscription_tier === "pro" ? 50 : 5;
    if (stakeAmount > maxAllowed || stakeAmount <= 0) {
      return new Response(JSON.stringify({ error: "Goal stake violates user subscription caps" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Insert Goal Row safely using service role (database transactions)
    const { data: goalRow, error: goalError } = await supabaseAdmin
      .from("goals")
      .insert({
        user_id: user.id,
        raw_text: rawText,
        smart_text: smartText,
        category,
        stake_amount: stakeAmount,
        consequence_type: consequenceType,
        consequence_target: consequenceTarget,
        status: "active",
        goal_date: goalDate,
      })
      .select()
      .single();

    if (goalError || !goalRow) {
      console.error("[verify-payment] Failed to save goal row:", goalError);
      return new Response(JSON.stringify({ error: "Failed to create goal contract ledger." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Insert Commitment Ledger Row
    const { error: commitmentError } = await supabaseAdmin
      .from("commitments")
      .insert({
        goal_id: goalRow.id,
        user_id: user.id,
        amount: stakeAmount,
        currency: "INR",
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_status: "authorized",
        status: "held",
      });

    if (commitmentError) {
      console.error("[verify-payment] Failed to save commitments ledger:", commitmentError);
      // Clean up orphaned goal
      await supabaseAdmin.from("goals").delete().eq("id", goalRow.id);
      return new Response(JSON.stringify({ error: "Failed to update financial commitments ledger." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, goalId: goalRow.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[verify-payment] Critical error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
