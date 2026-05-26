import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "@clerk/clerk-expo";
import { colors } from "@/constants/theme";
import { StreakRing } from "@/components/goal/StreakRing";
import { GoalCard } from "@/components/goal/GoalCard";
import { SubTaskList } from "@/components/goal/SubTaskList";
import { Button } from "@/components/ui/Button";
import { useUser } from "@/hooks/useUser";
import { getSupabase } from "@/lib/supabase";
import { requestPermission } from "@/lib/notifications";
import type { Goal } from "@/types/database";
import { Bell, ChevronRight } from "lucide-react-native";

export default function Home() {
  const router = useRouter();
  const { dbUser, loading: userLoading, refetch: refetchUser } = useUser();
  const { getToken } = useAuth();

  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [subTasks, setSubTasks] = useState<string[]>([]);
  const [subTasksCompleted, setSubTasksCompleted] = useState<boolean[]>([]);
  const [loadingGoal, setLoadingGoal] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActiveGoal = useCallback(async () => {
    if (!dbUser) return;
    try {
      setLoadingGoal(true);
      const supabase = await getSupabase(getToken);

      // Query the single active goal from Supabase
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", dbUser.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("[Home] Fetch goal error:", error.message);
      }

      if (data) {
        setActiveGoal(data);

        // Fetch sub-tasks from local SecureStore cache for this goal
        const cachedTasks = await SecureStore.getItemAsync(`subtasks_${data.id}`);
        if (cachedTasks) {
          const parsed: string[] = JSON.parse(cachedTasks);
          setSubTasks(parsed);

          // Get checked state if exists, else default false array
          const checkedState = await SecureStore.getItemAsync(`subtasks_completed_${data.id}`);
          if (checkedState) {
            setSubTasksCompleted(JSON.parse(checkedState));
          } else {
            setSubTasksCompleted(new Array(parsed.length).fill(false));
          }
        } else {
          // Default fallbacks
          const fallback = ["Complete daily declaration", "Follow up on goals", "Log evening check-in"];
          setSubTasks(fallback);
          setSubTasksCompleted(new Array(fallback.length).fill(false));
        }
      } else {
        setActiveGoal(null);
        setSubTasks([]);
        setSubTasksCompleted([]);
      }
    } catch (err) {
      console.error("[Home] Load active goal failed:", err);
    } finally {
      setLoadingGoal(false);
    }
  }, [dbUser, getToken]);

  useEffect(() => {
    if (dbUser) {
      fetchActiveGoal();
    }
  }, [dbUser?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([refetchUser(), fetchActiveGoal()]);
    setRefreshing(false);
  };

  const handleToggleSubtask = async (idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = [...subTasksCompleted];
    updated[idx] = !updated[idx];
    setSubTasksCompleted(updated);

    if (activeGoal) {
      await SecureStore.setItemAsync(`subtasks_completed_${activeGoal.id}`, JSON.stringify(updated));
    }
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 18) return "Good afternoon";
    return "Good evening";
  };

  // Check-in window calculation (2 hours before to 1 hour after checkin_time)
  const checkinTime = dbUser?.checkin_time || "21:00:00";
  const [cHours, cMinutes] = checkinTime.split(":").map(Number);
  const now = new Date();
  const checkinDate = new Date();
  checkinDate.setHours(cHours, cMinutes, 0, 0);
  const diffMs = checkinDate.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const showCheckinButton = diffHours <= 2 && diffHours >= -1;

  const displayGreeting = dbUser?.display_name
    ? `${getGreeting()}, ${dbUser.display_name.split(" ")[0]}!`
    : `${getGreeting()}!`;

  if (userLoading || (loadingGoal && !refreshing)) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent.default} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent.default} />
        }
      >
        {/* Header Block */}
        <View style={styles.header}>
          <View style={styles.welcomeBox}>
            <Text style={styles.greeting}>{displayGreeting}</Text>
            <Text style={styles.tagline}>Here is your dashboard for today.</Text>
          </View>
          <StreakRing streak={dbUser?.streak_current || 0} size={76} />
        </View>

        {/* Notification Permission Banner */}
        {!dbUser?.expo_push_token && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.notifBanner}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const result = await requestPermission(dbUser?.clerk_id);
              if (result === "granted") {
                refetchUser();
              }
            }}
          >
            <View style={styles.notifIconContainer}>
              <Bell size={20} color={colors.accent.light} />
            </View>
            <View style={styles.notifTextContainer}>
              <Text style={styles.notifTitle}>Enable Reminders</Text>
              <Text style={styles.notifSubtitle}>
                Get notified before your daily check-in window closes
              </Text>
            </View>
            <ChevronRight size={18} color={colors.text.tertiary} style={styles.notifArrow} />
          </TouchableOpacity>
        )}

        {activeGoal ? (
          <View style={styles.activeGoalSection}>
            {/* Goal Card Component */}
            <GoalCard goal={activeGoal} />

            {/* Sub-tasks Section */}
            <View style={styles.subtasksCard}>
              <Text style={styles.sectionTitle}>🎯 DAILY ACTION CHECKLIST</Text>
              <View style={styles.divider} />
              
              <SubTaskList
                tasks={subTasks}
                completed={subTasksCompleted}
                onToggle={handleToggleSubtask}
              />
            </View>

            {/* Accountability status note */}
            <View style={styles.contractAlert}>
              <Text style={styles.contractAlertText}>
                🔒 **Staking active.** Check in before **{dbUser?.checkin_time?.substring(0, 5) || "21:00"}** to release your **₹{activeGoal.stake_amount}** hold!
              </Text>
            </View>

            {/* Check-in Trigger CTA Button */}
            {showCheckinButton && (
              <Button
                label="Check In Now 🎯"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push({
                    pathname: "/checkin",
                    params: { goalId: activeGoal.id },
                  });
                }}
                variant="primary"
                fullWidth={true}
              />
            )}
          </View>
        ) : (
          <View style={styles.emptyStateSection}>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🔥</Text>
              <Text style={styles.emptyTitle}>Your daily commitment</Text>
              <Text style={styles.emptyText}>
                No goal has been declared yet today. Lock in your stake and build your accountability streak!
              </Text>
              <Button
                label="Declare Today's Goal"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/goal/declare");
                }}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
    paddingTop: Platform.OS === "ios" ? 12 : (StatusBar.currentHeight || 0) + 12,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg.base,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 12 : (StatusBar.currentHeight || 0) + 12,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 120, // Increased bottom padding so you can scroll and find each section clearly!
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  welcomeBox: {
    flex: 1,
    marginRight: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text.primary,
  },
  tagline: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: 4,
  },
  activeGoalSection: {
    gap: 16,
  },
  subtasksCard: {
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text.secondary,
    letterSpacing: 1.2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: 14,
  },
  contractAlert: {
    backgroundColor: colors.border.emphasis + "10",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  contractAlertText: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 18,
    textAlign: "center",
  },
  emptyStateSection: {
    flex: 1,
    justifyContent: "center",
    paddingTop: 40,
  },
  emptyCard: {
    backgroundColor: colors.bg.card,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  emptyEmoji: {
    fontSize: 54,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  notifBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  notifIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  notifTextContainer: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 2,
  },
  notifSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  notifArrow: {
    marginLeft: 8,
  },
});
