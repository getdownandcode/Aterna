import React from "react";
import { View, Text, SafeAreaView, StyleSheet, ScrollView, Platform, StatusBar } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Check, Edit3, X, HelpCircle } from "lucide-react-native";
import { colors } from "@/constants/theme";
import { Button } from "@/components/ui/Button";
import { DebriefCard } from "@/components/checkin/DebriefCard";
import { StreakCelebration } from "@/components/checkin/StreakCelebration";

export default function CheckinResult() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parse routing parameters safely
  const outcome = (params.outcome as "completed" | "partial" | "failed") || "completed";
  const newStreak = parseInt((params.newStreak as string) || "0", 10);
  const isMilestone = params.isMilestone === "true";
  const debriefText = (params.debriefText as string) || null;
  const stakeAmount = parseFloat((params.stakeAmount as string) || "0");
  const consequenceTarget = (params.consequenceTarget as string) || "charity partner";

  const handleNextSteps = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Replace to home and let the user declare a new goal from there
    router.replace("/home");
  };

  const renderOutcomeHeader = () => {
    switch (outcome) {
      case "completed":
        return (
          <View style={styles.headerWrapper}>
            <View style={[styles.iconCircle, { backgroundColor: colors.success.default + "15", borderColor: colors.success.default + "30" }]}>
              <Check color={colors.success.default} size={48} />
            </View>
            <Text style={styles.title}>You did it.</Text>
            <Text style={styles.subtitle}>
              100% completed. ₹{stakeAmount.toLocaleString("en-IN")} returned safely to your card.
            </Text>
          </View>
        );
      case "partial":
        return (
          <View style={styles.headerWrapper}>
            <View style={[styles.iconCircle, { backgroundColor: colors.warning.default + "15", borderColor: colors.warning.default + "30" }]}>
              <Edit3 color={colors.warning.default} size={48} />
            </View>
            <Text style={styles.title}>Partial progress.</Text>
            <Text style={styles.subtitle}>
              Goal partially met. ₹{Math.floor(stakeAmount * 0.5).toLocaleString("en-IN")} returned. ₹{Math.ceil(stakeAmount * 0.5).toLocaleString("en-IN")} sent to {consequenceTarget}.
            </Text>
          </View>
        );
      case "failed":
        return (
          <View style={styles.headerWrapper}>
            <View style={[styles.iconCircle, { backgroundColor: colors.danger.default + "15", borderColor: colors.danger.default + "30" }]}>
              <X color={colors.danger.default} size={48} />
            </View>
            <Text style={styles.title}>Goal missed.</Text>
            <Text style={styles.subtitle}>
              Your streak has reset. ₹{stakeAmount.toLocaleString("en-IN")} sent to {consequenceTarget} as per your agreement.
            </Text>
          </View>
        );
      default:
        return (
          <View style={styles.headerWrapper}>
            <View style={styles.iconCircle}>
              <HelpCircle color={colors.text.secondary} size={48} />
            </View>
            <Text style={styles.title}>Progress Logged.</Text>
            <Text style={styles.subtitle}>Your goal status has been synchronized successfully.</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderOutcomeHeader()}

        {/* Streak Celebration Animation Block */}
        {outcome !== "failed" && (
          <StreakCelebration streakCount={newStreak} isMilestone={isMilestone} />
        )}

        {/* AI Debrief Card */}
        <View style={styles.section}>
          <DebriefCard text={debriefText} variant={outcome === "completed" ? "success" : outcome} loading={false} />
        </View>

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          <Button
            label={outcome === "failed" ? "Start Fresh Tomorrow" : "Continue Journey"}
            onPress={handleNextSteps}
            variant="primary"
            fullWidth={true}
          />
        </View>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    paddingBottom: 120,
  },
  headerWrapper: {
    alignItems: "center",
    marginTop: 28,
    marginBottom: 16,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.text.secondary,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  section: {
    width: "100%",
    marginVertical: 12,
  },
  buttonContainer: {
    width: "100%",
    marginTop: 24,
    paddingHorizontal: 8,
  },
});
