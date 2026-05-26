import { getSupabase } from "./supabase";

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK_PAYMENTS === "true";

interface CreateOrderResult {
  success: boolean;
  orderId?: string;
  amountPaise?: number;
  keyId?: string;
  error?: string;
}

interface CheckoutResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  signature?: string;
  error?: string;
}

interface VerifyResult {
  success: boolean;
  goalId?: string;
  error?: string;
}

interface ResolveResult {
  success: boolean;
  amountCaptured?: number;
  amountRefunded?: number;
  error?: string;
}

/**
 * Creates an authorized order via Razorpay Edge Function (or simulates in mock mode).
 */
export async function createOrder(
  amount: number,
  goalId: string,
  getToken: () => Promise<string | null | undefined>
): Promise<CreateOrderResult> {
  if (USE_MOCK) {
    console.log(`[Payments Mock] 💳 Creating Mock Order for ₹${amount} (Goal: ${goalId})`);
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      success: true,
      orderId: `mock_order_${Math.random().toString(36).substring(2, 11)}`,
      amountPaise: Math.round(amount * 100),
      keyId: "rzp_test_mock_key_id",
    };
  }

  try {
    const supabase = await getSupabase(getToken);
    const { data, error } = await supabase.functions.invoke("create-order", {
      body: { amount, goalId },
    });

    if (error || !data) {
      console.error("[Payments] createOrder edge function error:", error);
      return { success: false, error: error?.message || "Failed to create order on server." };
    }

    return {
      success: true,
      orderId: data.orderId,
      amountPaise: data.amount,
      keyId: data.keyId,
    };
  } catch (err) {
    console.error("[Payments] createOrder failed:", err);
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

/**
 * Opens the native Razorpay Checkout Sheet on the device.
 */
export async function openCheckoutSheet(
  orderDetails: { orderId: string; amountPaise: number; keyId: string },
  userDetails: { email: string; displayName: string },
  goalText: string
): Promise<CheckoutResult> {
  if (USE_MOCK) {
    console.log(`[Payments Mock] 🚀 Opening checkout sheet for order ${orderDetails.orderId}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      success: true,
      paymentId: `mock_pay_${Math.random().toString(36).substring(2, 11)}`,
      orderId: orderDetails.orderId,
      signature: "mock_signature_verified_signature",
    };
  }

  return new Promise((resolve) => {
    try {
      let RazorpayCheckout: any = null;
      try {
        RazorpayCheckout = require("react-native-razorpay").default;
      } catch (requireErr) {
        console.error("[Payments] Could not require react-native-razorpay. Make sure you are using a development build with the SDK linked.", requireErr);
        resolve({
          success: false,
          error: "Razorpay Native SDK not loaded. If running in simulator/Expo Go, enable EXPO_PUBLIC_USE_MOCK_PAYMENTS=true.",
        });
        return;
      }

      if (!RazorpayCheckout) {
        resolve({ success: false, error: "Razorpay Checkout is not available." });
        return;
      }

      const options = {
        description: goalText.substring(0, 50),
        image: "https://i.imgur.com/3g7A6tw.png", // Aterna Logo Placeholder
        currency: "INR",
        key: orderDetails.keyId,
        amount: orderDetails.amountPaise,
        external: {
          wallets: ["paytm"]
        },
        name: "Aterna",
        order_id: orderDetails.orderId,
        prefill: {
          email: userDetails.email || "user@aterna.app",
          contact: "9999999999", // Placeholder contact required by Razorpay
          name: userDetails.displayName || "Aterna User"
        },
        theme: {
          color: "#7B6EF6" // Aterna Accent Color
        }
      };

      RazorpayCheckout.open(options)
        .then((data: any) => {
          console.log("[Payments] checkout success data:", data);
          resolve({
            success: true,
            paymentId: data.razorpay_payment_id,
            orderId: data.razorpay_order_id,
            signature: data.razorpay_signature,
          });
        })
        .catch((error: any) => {
          console.log("[Payments] checkout error:", error);
          if (error?.code === "PAYMENT_CANCELLED" || error?.description === "Payment Cancelled") {
            resolve({ success: false, error: "PAYMENT_CANCELLED" });
          } else {
            resolve({ success: false, error: error?.description || "Payment sheet transaction failed." });
          }
        });
    } catch (err) {
      console.error("[Payments] openCheckoutSheet crashed:", err);
      resolve({ success: false, error: "Checkout sheet crashed unexpectedly." });
    }
  });
}

/**
 * Verifies payment signature and saves the goal & commitment securely inside the DB.
 */
export async function verifyAndSaveGoal(
  paymentResult: { paymentId: string; orderId: string; signature: string },
  goalData: {
    rawText: string;
    smartText: string;
    category: string;
    stakeAmount: number;
    consequenceType: string;
    consequenceTarget: string | null;
    goalDate: string;
  },
  getToken: () => Promise<string | null | undefined>
): Promise<VerifyResult> {
  if (USE_MOCK) {
    console.log("[Payments Mock] 🔒 Verifying payment and saving goal locally");
    await new Promise((resolve) => setTimeout(resolve, 800));
    try {
      const supabase = await getSupabase(getToken);
      const { data: userRow } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("goals")
        .insert({
          user_id: userRow?.user?.id,
          raw_text: goalData.rawText,
          smart_text: goalData.smartText,
          category: goalData.category,
          stake_amount: goalData.stakeAmount,
          consequence_type: goalData.consequenceType,
          consequence_target: goalData.consequenceTarget,
          status: "active",
          goal_date: goalData.goalDate,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from("commitments").insert({
        goal_id: data.id,
        user_id: userRow?.user?.id,
        amount: goalData.stakeAmount,
        currency: "INR",
        razorpay_order_id: paymentResult.orderId,
        razorpay_payment_id: paymentResult.paymentId,
        razorpay_status: "authorized",
        status: "held",
      });

      return { success: true, goalId: data.id };
    } catch (err) {
      console.error("[Payments Mock] verifyAndSaveGoal failed:", err);
      return { success: false, error: "Database transaction failed." };
    }
  }

  try {
    const supabase = await getSupabase(getToken);
    const { data, error } = await supabase.functions.invoke("verify-payment", {
      body: {
        razorpay_order_id: paymentResult.orderId,
        razorpay_payment_id: paymentResult.paymentId,
        razorpay_signature: paymentResult.signature,
        rawText: goalData.rawText,
        smartText: goalData.smartText,
        category: goalData.category,
        stakeAmount: goalData.stakeAmount,
        consequenceType: goalData.consequenceType,
        consequenceTarget: goalData.consequenceTarget,
        goalDate: goalData.goalDate,
      },
    });

    if (error || !data) {
      console.error("[Payments] verifyAndSaveGoal edge function error:", error);
      return { success: false, error: error?.message || "Payment signature mismatch / fraud detected." };
    }

    return {
      success: true,
      goalId: data.goalId,
    };
  } catch (err) {
    console.error("[Payments] verifyAndSaveGoal failed:", err);
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

/**
 * Resolves a held payment (refunds or captures) based on evening check-in outcome.
 */
export async function resolvePayment(
  goalId: string,
  outcome: "completed" | "partial" | "failed",
  getToken: () => Promise<string | null | undefined>
): Promise<ResolveResult> {
  if (USE_MOCK) {
    console.log(`[Payments Mock] 🔓 Resolving mock payment for goal ${goalId} with outcome ${outcome}`);
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      success: true,
      amountCaptured: outcome === "completed" ? 0 : outcome === "partial" ? 0.5 : 1.0,
      amountRefunded: outcome === "completed" ? 1.0 : outcome === "partial" ? 0.5 : 0,
    };
  }

  try {
    const supabase = await getSupabase(getToken);
    const { data, error } = await supabase.functions.invoke("resolve-payment", {
      body: { goalId, outcome },
    });

    if (error || !data) {
      console.error("[Payments] resolvePayment edge function error:", error);
      return { success: false, error: error?.message || "Failed to resolve payment." };
    }

    return {
      success: true,
      amountCaptured: data.amountCaptured,
      amountRefunded: data.amountRefunded,
    };
  } catch (err) {
    console.error("[Payments] resolvePayment failed:", err);
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}
