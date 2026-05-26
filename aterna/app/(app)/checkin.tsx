import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import { ShieldAlert, Mic, Square, Trash2 } from "lucide-react-native";
import { colors } from "@/constants/theme";
import { Button } from "@/components/ui/Button";
import { OutcomeButtons } from "@/components/checkin/OutcomeButtons";
import { ReasonChips } from "@/components/checkin/ReasonChips";
import { useUser } from "@/hooks/useUser";
import { useCheckin } from "@/hooks/useCheckin";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@clerk/clerk-expo";
import type { Goal } from "@/types/database";

export default function Checkin() {
  const router = useRouter();
  const { goalId } = useLocalSearchParams();
  const { dbUser } = useUser();
  const { getToken } = useAuth();
  const { submitCheckin, loading: isSubmitting } = useCheckin();

  // Component states
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loadingGoal, setLoadingGoal] = useState(true);
  const [selectedOutcome, setSelectedOutcome] = useState<"completed" | "partial" | "failed" | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Audio Recording States
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<any>(null);

  // Load goal and check status on mount
  useEffect(() => {
    const fetchGoal = async () => {
      if (!goalId) {
        router.replace("/already-checked-in");
        return;
      }

      try {
        setLoadingGoal(true);
        const supabase = await getSupabase(getToken);

        const { data: goalRow, error } = await supabase
          .from("goals")
          .select("*")
          .eq("id", goalId)
          .maybeSingle();

        if (error || !goalRow) {
          console.warn("[Checkin] Goal not found:", error);
          router.replace("/already-checked-in");
          return;
        }

        // Direct guard: if not active, redirect immediately
        if (goalRow.status !== "active") {
          console.log("[Checkin] Goal is not active. Redirecting to already-checked-in screen.");
          router.replace("/already-checked-in");
          return;
        }

        setGoal(goalRow);
      } catch (err) {
        console.error("[Checkin] Failed to load goal details:", err);
        router.replace("/already-checked-in");
      } finally {
        setLoadingGoal(false);
      }
    };

    fetchGoal();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [goalId]);

  // Audio permission request on mount
  useEffect(() => {
    Audio.requestPermissionsAsync();
  }, []);

  // Audio Recording Helpers
  const startRecording = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= 29) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording:", err);
      Alert.alert("Permission Required", "Could not start audio recording. Please enable microphone permissions in your settings.");
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordedUri(uri);
      setRecording(null);
    } catch (err) {
      console.error("Failed to stop recording:", err);
    }
  };

  const handleResetRecord = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRecordedUri(null);
    setDuration(0);
  };

  // Submit Handler
  const handleSubmit = async () => {
    if (!goal || !dbUser || !selectedOutcome) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSubmitError(null);

    const result = await submitCheckin({
      goalId: goal.id,
      userId: dbUser.id,
      outcome: selectedOutcome,
      voiceUri: recordedUri,
      selectedReasons,
      goal,
    });

    if (result.success) {
      // Go to check-in result screen
      router.replace({
        pathname: "/checkin-result",
        params: {
          outcome: selectedOutcome,
          newStreak: result.newStreak,
          isMilestone: String(result.isMilestone),
          debriefText: result.debriefText || "",
          stakeAmount: goal.stake_amount,
          consequenceTarget: goal.consequence_target || "charity partner",
          goalText: goal.smart_text || goal.raw_text,
        },
      });
    } else {
      setSubmitError(result.error || "Failed to log check-in. Please try again.");
    }
  };

  if (loadingGoal || !goal) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent.default} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Block */}
        <View style={styles.header}>
          <Text style={styles.timeTag}>🕒 DAILY CHECK-IN WINDOW</Text>
          <Text style={styles.headerTitle}>Accountability Review</Text>
          <Text style={styles.headerSub}>
            Your stake of <Text style={styles.stakeText}>₹{goal.stake_amount.toLocaleString("en-IN")}</Text> is on the line. Be honest.
          </Text>
        </View>

        {/* Active Goal Recap */}
        <View style={styles.goalCard}>
          <Text style={styles.goalCardLabel}>🎯 SMART GOAL CONTRACT</Text>
          <Text style={styles.goalCardText}>{goal.smart_text || goal.raw_text}</Text>
        </View>

        {/* Outcome Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What was today's outcome?</Text>
          <OutcomeButtons selected={selectedOutcome} onSelect={setSelectedOutcome} />
        </View>

        {/* Conditionally Rendered Check-in Details */}
        {selectedOutcome && (
          <View style={styles.detailsContainer}>
            {/* Fail reasons chips */}
            {selectedOutcome === "failed" && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>What held you back today? (Optional)</Text>
                <ReasonChips selected={selectedReasons} onChange={setSelectedReasons} />
              </View>
            )}

            {/* Voice Debrief Recorder */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Record a daily debrief (Optional)</Text>
              <View style={styles.recorderCard}>
                {!recordedUri ? (
                  <View style={styles.recordingRow}>
                    <Pressable
                      onPress={isRecording ? stopRecording : startRecording}
                      style={[
                        styles.recordButton,
                        { backgroundColor: isRecording ? colors.danger.bg : colors.accent.surface },
                      ]}
                    >
                      {isRecording ? (
                        <Square color={colors.danger.default} size={24} fill={colors.danger.default} />
                      ) : (
                        <Mic color={colors.accent.default} size={24} />
                      )}
                    </Pressable>

                    <View style={styles.recordStatusColumn}>
                      <Text style={styles.recorderText}>
                        {isRecording ? "Recording your debrief..." : "Aterna AI learns from your daily rhythm."}
                      </Text>
                      <Text style={styles.recorderTime}>
                        {isRecording ? `00:${duration.toString().padStart(2, "0")}` : "Max length 30s"}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.recordingRow}>
                    <View style={[styles.recordButton, { backgroundColor: colors.success.bg }]}>
                      <Mic color={colors.success.default} size={24} />
                    </View>

                    <View style={styles.recordStatusColumn}>
                      <Text style={styles.recorderText}>Voice debrief saved successfully!</Text>
                      <Text style={styles.recorderTime}>Ready to analyze</Text>
                    </View>

                    <Pressable onPress={handleResetRecord} style={styles.trashBtn}>
                      <Trash2 color={colors.danger.default} size={20} />
                    </Pressable>
                  </View>
                )}
              </View>
            </View>

            {/* Submit Button Block */}
            <View style={styles.submitSection}>
              {submitError && (
                <View style={styles.errorAlert}>
                  <ShieldAlert color={colors.danger.default} size={20} />
                  <Text style={styles.errorAlertText}>{submitError}</Text>
                </View>
              )}

              <Button
                label="Submit Daily Check-in"
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={isSubmitting}
                variant="primary"
                fullWidth={true}
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  header: {
    marginTop: 16,
    marginBottom: 24,
  },
  timeTag: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.accent.light,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text.primary,
    marginBottom: 6,
  },
  headerSub: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  stakeText: {
    fontWeight: "700",
    color: colors.warning.default,
  },
  goalCard: {
    backgroundColor: colors.bg.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: 24,
  },
  goalCardLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text.tertiary,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  goalCardText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.primary,
    fontWeight: "600",
  },
  section: {
    marginVertical: 12,
    width: "100%",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 12,
  },
  detailsContainer: {
    width: "100%",
  },
  recorderCard: {
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: 16,
  },
  recordingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  recordButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  recordStatusColumn: {
    flex: 1,
    justifyContent: "center",
  },
  recorderText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.primary,
  },
  recorderTime: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 4,
  },
  trashBtn: {
    padding: 10,
  },
  submitSection: {
    marginTop: 28,
    width: "100%",
  },
  errorAlert: {
    backgroundColor: colors.danger.bg + "15",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.danger.default + "30",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  errorAlertText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.danger.default,
    flex: 1,
  },
});
