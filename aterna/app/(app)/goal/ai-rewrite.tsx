import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { colors } from "@/constants/theme";
import { Button } from "@/components/ui/Button";
import { goalStore } from "@/lib/goalStore";
import { smartRewrite } from "@/lib/gemini";

export default function AiRewrite() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Original cached state
  const { rawText, audioBase64 } = goalStore.get();

  // AI Generated output state
  const [smartText, setSmartText] = useState("");
  const [subTasks, setSubTasks] = useState<string[]>([]);

  useEffect(() => {
    const fetchRewrite = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch multimodal SMART goal rewrite from Gemini
        const result = await smartRewrite(rawText, audioBase64);
        
        setSmartText(result.smart_text);
        setSubTasks(result.sub_tasks);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to compile SMART rewrite.";
        setError(message);
        console.error("[AiRewrite] Gemini error:", message);
      } finally {
        setLoading(false);
      }
    };

    fetchRewrite();
  }, [rawText, audioBase64]);

  const handleUseSmart = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    goalStore.set({
      smartText: smartText,
      subTasks: subTasks,
    });
    router.push("/goal/stake");
  };

  const handleKeepOriginal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    goalStore.set({
      smartText: rawText === "Voice goal declaration" ? smartText : rawText,
      subTasks: subTasks.length > 0 ? subTasks : ["Complete my declared focus today."],
    });
    router.push("/goal/stake");
  };

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={colors.accent.default} />
          <Text style={styles.loadingTitle}>Coaching you to success...</Text>
          <Text style={styles.loadingSubtitle}>
            Our AI Coach is structuring your daily goal into a hyper-focused, measurable SMART contract.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContent}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>SMART Rewrite Failed</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleGoBack}>
            <Text style={styles.retryText}>Edit Goal Statement</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Premium Navigation Header Row */}
      <View style={styles.topHeaderBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.topBackButton}
          onPress={handleGoBack}
        >
          <ChevronLeft color={colors.text.secondary} size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={styles.step}>Step 2 of 4</Text>
        <Text style={styles.title}>Your accountability coach</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* original declaration */}
        <View style={styles.originalCard}>
          <Text style={styles.cardHeader}>ORIGINAL STATEMENT</Text>
          <Text style={styles.originalText}>
            {rawText === "Voice goal declaration" ? "🎤 Voice Memo Declaration" : rawText}
          </Text>
        </View>

        {/* AI Rewrite side */}
        <View style={styles.smartCard}>
          <View style={styles.smartHeaderRow}>
            <Text style={styles.smartCardHeader}>🔥 ATERNA SMART REWRITE</Text>
            <View style={styles.badgeRow}>
              {["S", "M", "A", "R", "T"].map((letter) => (
                <View key={letter} style={styles.badge}>
                  <Text style={styles.badgeText}>{letter}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.smartText}>{smartText}</Text>

          <View style={styles.divider} />

          <Text style={styles.subtasksTitle}>📊 Actionable Daily Subtasks</Text>
          {subTasks.map((task, idx) => (
            <View key={idx} style={styles.taskRow}>
              <View style={styles.taskBullet}>
                <Text style={styles.bulletText}>{idx + 1}</Text>
              </View>
              <Text style={styles.taskText}>{task}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Adopt SMART Rewrite" onPress={handleUseSmart} />
        {rawText !== "Voice goal declaration" && (
          <TouchableOpacity style={styles.secondaryButton} onPress={handleKeepOriginal}>
            <Text style={styles.secondaryButtonText}>Keep Original Version</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>← Edit focus statement</Text>
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
  },
  loadingContent: {
    flex: 1,
    padding: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text.primary,
    marginTop: 24,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  errorContent: {
    flex: 1,
    padding: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.bg.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  retryText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 24,
    gap: 16,
  },
  originalCard: {
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  cardHeader: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text.tertiary,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  originalText: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  smartCard: {
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: colors.accent.default + "40",
  },
  smartHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  smartCardHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.accent.default,
    letterSpacing: 1.2,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 3,
  },
  badge: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: colors.accent.default,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: colors.bg.base,
    fontSize: 10,
    fontWeight: "800",
  },
  smartText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: 16,
  },
  subtasksTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 12,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  taskBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.border.emphasis,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  bulletText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text.secondary,
  },
  taskText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.secondary,
  },
  footer: {
    padding: 24,
    gap: 12,
    paddingBottom: 40,
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.secondary,
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
