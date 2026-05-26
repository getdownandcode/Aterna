import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
} from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { colors } from "@/constants/theme";
import { Button } from "@/components/ui/Button";
import { goalStore } from "@/lib/goalStore";
import { useUser } from "@/hooks/useUser";
import { getSupabase } from "@/lib/supabase";
import { scheduleCheckinNotification } from "@/lib/notifications";
import { useAuth } from "@clerk/clerk-expo";

export default function Confirm() {
  const router = useRouter();
  const { goalId } = useLocalSearchParams();
  const { dbUser } = useUser();
  const { getToken } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchVerifiedGoal = async () => {
      if (!goalId) {
        Alert.alert("Error", "Goal ID is missing. Redirecting home.");
        router.replace("/home");
        return;
      }

      try {
        setLoading(true);
        const supabase = await getSupabase(getToken);
        const { data, error } = await supabase
          .from("goals")
          .select("*")
          .eq("id", goalId)
          .single();

        if (error || !data) {
          throw new Error(error?.message || "Goal record not found.");
        }

        setGoal(data);
      } catch (err) {
        console.error("[Confirm] Fetch goal failed:", err);
        Alert.alert("Contract Not Found", "Failed to retrieve your verified goal contract.");
        router.replace("/home");
      } finally {
        setLoading(false);
      }
    };

    fetchVerifiedGoal();
  }, [goalId]);

  const handleConfirm = async () => {
    if (!dbUser || !goal) {
      Alert.alert("Authentication required", "Your user profile is not fully loaded yet.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSubmitting(true);

    try {
      // 1. Cache the subtasks locally
      const { subTasks } = goalStore.get();
      if (subTasks && subTasks.length > 0) {
        await SecureStore.setItemAsync(`subtasks_${goal.id}`, JSON.stringify(subTasks));
      }

      // 2. Schedule check-in notification for today at user.checkin_time
      try {
        const checkinTime = dbUser.checkin_time || "21:00:00";
        await scheduleCheckinNotification(
          goal.id,
          checkinTime,
          goal.smart_text || goal.raw_text
        );
      } catch (notifErr) {
        console.error("[Confirm] Failed to schedule check-in notification:", notifErr);
      }

      // Success haptics & navigation
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        "Contract Live! 🛡️",
        `Your stake hold is secured. Check in before ${dbUser.checkin_time?.substring(0, 5) || "21:00"} to release your funds.`,
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
      const message = err instanceof Error ? err.message : "Cache/Notification setup failed.";
      Alert.alert("Contract Error", message);
    } finally {
      setSubmitting(false);
    }
  };

  const getConsequenceText = () => {
    if (!goal) return "";
    const { consequence_type, consequence_target } = goal;
    if (consequence_type === "charity") return `Donated to ${consequence_target}`;
    if (consequence_type === "friend_pool") return `Sent to friend: ${consequence_target}`;
    return `Physical consequence: ${consequence_target}`;
  };

  if (loading || !goal) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={colors.accent.default} />
          <Text style={styles.loadingText}>Retrieving verified contract...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Navigation Header Row */}
      <View style={styles.topHeaderBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.topBackButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <ChevronLeft color={colors.text.secondary} size={20} />
        </TouchableOpacity>
      </View>

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
            <Text style={styles.smartGoal}>{goal.smart_text || goal.raw_text}</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>CATEGORY</Text>
              <Text style={styles.value}>
                {goal.category.charAt(0).toUpperCase() + goal.category.slice(1)}
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>DAILY STAKE</Text>
              <Text style={[styles.value, styles.accentValue]}>
                ₹{goal.stake_amount} INR
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
            ⚠️ **Terms:** By signing this contract, you authorize Aterna to place a secure hold of **₹{goal.stake_amount}** using Razorpay. This hold is fully released upon checking in as **Done** before the deadline.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        {submitting ? (
          <ActivityIndicator size="large" color={colors.accent.default} />
        ) : (
          <Button label="Sign & Activate Contract" onPress={handleConfirm} />
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
    paddingTop: Platform.OS === "ios" ? 12 : (StatusBar.currentHeight || 0) + 12,
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: "500",
  },
  topHeaderBar: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 0,
  },
  topBackButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.default,
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
