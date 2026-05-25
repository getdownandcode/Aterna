import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { colors } from "@/constants/theme";
import { Button } from "@/components/ui/Button";
import { goalStore } from "@/lib/goalStore";
import { useUser } from "@/hooks/useUser";
import { getSupabaseClient } from "@/lib/supabase";
import { useAuth } from "@clerk/clerk-expo";

export default function Confirm() {
  const router = useRouter();
  const { dbUser } = useUser();
  const { getToken } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  // Retrieve complete cached goal declaration details
  const {
    rawText,
    category,
    smartText,
    subTasks,
    stakeAmount,
    consequenceType,
    consequenceTarget,
  } = goalStore.get();

  const handleConfirm = async () => {
    if (!dbUser) {
      Alert.alert("Authentication required", "Your user profile is not fully loaded yet.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSubmitting(true);

    try {
      // 1. Get Supabase client token
      const token = await getToken({ template: "supabase" });
      if (!token) throw new Error("Could not acquire credentials.");
      const supabase = getSupabaseClient(token);

      const localDate = new Date().toISOString().split("T")[0];

      // 2. Insert Goal record
      const { data: goalData, error: goalError } = await supabase
        .from("goals")
        .insert({
          user_id: dbUser.id,
          raw_text: rawText,
          smart_text: smartText || rawText,
          category: category,
          stake_amount: stakeAmount || 0,
          consequence_type: consequenceType || "charity",
          consequence_target: consequenceTarget || null,
          status: "active",
          share_to_feed: false,
          goal_date: localDate,
        })
        .select()
        .single();

      if (goalError) {
        throw new Error(`Failed to create goal contract: ${goalError.message}`);
      }

      // Persist AI-generated subtasks locally
      if (subTasks && subTasks.length > 0) {
        await SecureStore.setItemAsync(`subtasks_${goalData.id}`, JSON.stringify(subTasks));
      }

      // 3. Insert Commitment ledger record
      if (stakeAmount && stakeAmount > 0) {
        const { error: commitmentError } = await supabase
          .from("commitments")
          .insert({
            goal_id: goalData.id,
            user_id: dbUser.id,
            amount: stakeAmount,
            currency: "USD",
            stripe_payment_intent_id: "rzp_test_mock_intent_" + Math.random().toString(36).substring(7),
            status: "held",
          });

        if (commitmentError) {
          console.error("[Confirm] Commitment ledger write failed:", commitmentError.message);
          // Non-blocking for the goal contract, but alert console
        }
      }

      // Success haptics & navigation
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        "Contract Active! 🛡️",
        "Your stake is locked, and your SMART goal contract is live. Make today count!",
        [
          {
            text: "Let's Go",
            onPress: () => {
              goalStore.reset();
              router.replace("/home");
            },
          },
        ]
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Persistence failed.";
      Alert.alert("Contract Error", message);
      console.error("[Confirm] Save failed:", message);
    } finally {
      setSubmitting(false);
    }
  };

  const getConsequenceText = () => {
    if (consequenceType === "charity") return `Donated to ${consequenceTarget}`;
    if (consequenceType === "friend_pool") return `Sent to friend: ${consequenceTarget}`;
    return `Physical consequence: ${consequenceTarget}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.step}>Step 4 of 4</Text>
        <Text style={styles.title}>Review & sign</Text>
        <Text style={styles.subtitle}>
          Verify the terms of your contract. There are no excuses once you tap confirm.
        </Text>
      </View>

      <View style={styles.content}>
        {/* The Receipt Contract Card */}
        <View style={styles.contractCard}>
          <Text style={styles.contractTitle}>📜 ACCOUNTABILITY CONTRACT</Text>
          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.label}>SMART FOCUS GOAL</Text>
            <Text style={styles.smartGoal}>{smartText}</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>CATEGORY</Text>
              <Text style={styles.value}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>DAILY STAKE</Text>
              <Text style={[styles.value, styles.accentValue]}>
                ${stakeAmount?.toFixed(2)} USD
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>FAILURE CONSEQUENCE</Text>
            <Text style={styles.value}>{getConsequenceText()}</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>PROMPT TIME</Text>
              <Text style={styles.subvalue}>
                {dbUser?.morning_time?.substring(0, 5) || "08:00"}
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>CHECK-IN DEADLINE</Text>
              <Text style={styles.subvalue}>
                {dbUser?.checkin_time?.substring(0, 5) || "21:00"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.termsBox}>
          <Text style={styles.termsText}>
            ⚠️ **Terms:** By confirming this contract, you authorise Aterna to place a secure hold of **${stakeAmount?.toFixed(2)}** using Razorpay. This hold is fully released upon checking in as **Done** before the deadline.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        {submitting ? (
          <ActivityIndicator size="large" color={colors.accent.default} />
        ) : (
          <Button label="Sign & Authorise Contract" onPress={handleConfirm} />
        )}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  header: {
    padding: 24,
    paddingBottom: 8,
  },
  step: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.accent.default,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    gap: 16,
  },
  contractCard: {
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: colors.border.emphasis,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  contractTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text.primary,
    textAlign: "center",
    letterSpacing: 1.5,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: 16,
  },
  section: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    marginBottom: 16,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.text.tertiary,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  smartGoal: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.primary,
    lineHeight: 22,
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
  },
  accentValue: {
    color: colors.accent.default,
  },
  subvalue: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: "500",
  },
  termsBox: {
    backgroundColor: colors.bg.card,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  termsText: {
    fontSize: 11,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  footer: {
    padding: 24,
    gap: 12,
    paddingBottom: 40,
  },
  backButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  backButtonText: {
    color: colors.text.tertiary,
    fontSize: 13,
    fontWeight: "500",
  },
});
