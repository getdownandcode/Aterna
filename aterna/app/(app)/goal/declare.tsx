import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { colors } from "@/constants/theme";
import { Button } from "@/components/ui/Button";
import { goalStore } from "@/lib/goalStore";
import { GoalCategory } from "@/types/database";

const CATEGORIES: { label: string; value: GoalCategory; emoji: string }[] = [
  { label: "Personal", value: "personal", emoji: "🌱" },
  { label: "Work", value: "work", emoji: "💼" },
  { label: "Health", value: "health", emoji: "⚡" },
  { label: "Learning", value: "learning", emoji: "🧠" },
  { label: "Creative", value: "creative", emoji: "🎨" },
  { label: "Financial", value: "financial", emoji: "📈" },
];

export default function Declare() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"voice" | "text">("voice");
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory>("personal");
  const [rawText, setRawText] = useState("");
  
  // Audio state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<any>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Request audio recording permissions on mount
    Audio.requestPermissionsAsync();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

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
          if (prev >= 59) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording:", err);
      Alert.alert("Error", "Could not start audio recording. Please check permissions.");
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

  // Convert local file URI to Base64 using native FileReader
  const convertUriToBase64 = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result?.toString().split(",")[1];
        if (base64String) {
          resolve(base64String);
        } else {
          reject(new Error("Failed to parse base64 data."));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (activeTab === "text" && !rawText.trim()) {
      Alert.alert("Goal required", "Please enter your goal text.");
      return;
    }
    if (activeTab === "voice" && !recordedUri) {
      Alert.alert("Voice memo required", "Please record your goal voice memo.");
      return;
    }

    setProcessing(true);
    try {
      let audioBase64: string | undefined;

      if (activeTab === "voice" && recordedUri) {
        audioBase64 = await convertUriToBase64(recordedUri);
      }

      // Cache state in global goalStore
      goalStore.reset();
      goalStore.set({
        rawText: activeTab === "text" ? rawText : "Voice goal declaration",
        category: selectedCategory,
        audioBase64,
      });

      router.push("/goal/ai-rewrite");
    } catch (err) {
      console.error("[Declare] Conversion error:", err);
      Alert.alert("Processing Error", "Failed to compile audio goal data.");
    } finally {
      setProcessing(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Declare today&apos;s goal</Text>
        <Text style={styles.subtitle}>
          Your word is your commitment. Pick a category and declare your focus.
        </Text>
      </View>

      {/* Categories Horizontal Scroll */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            return (
              <TouchableOpacity
                key={cat.value}
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedCategory(cat.value);
                }}
                style={[
                  styles.categoryPill,
                  isSelected && styles.categoryPillSelected,
                ]}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    isSelected && styles.categoryLabelSelected,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tabs voice/text */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "voice" && styles.tabActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab("voice");
          }}
        >
          <Text style={[styles.tabText, activeTab === "voice" && styles.tabTextActive]}>
            🎤 Voice Memo
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "text" && styles.tabActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab("text");
          }}
        >
          <Text style={[styles.tabText, activeTab === "text" && styles.tabTextActive]}>
            ✍️ Text Input
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === "voice" ? (
          <View style={styles.voiceSection}>
            {recordedUri ? (
              <View style={styles.recordedBox}>
                <Text style={styles.recordedEmoji}>🎉</Text>
                <Text style={styles.recordedText}>Voice goal recorded successfully!</Text>
                <Text style={styles.durationText}>Length: {formatTime(duration)}</Text>
                <TouchableOpacity style={styles.resetButton} onPress={handleResetRecord}>
                  <Text style={styles.resetButtonText}>🔄 Record again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.recorderBox}>
                <Text style={styles.recordInstruction}>
                  {isRecording ? "Listening to your goal..." : "Tap the mic to declare your goal"}
                </Text>
                {isRecording && (
                  <View style={styles.pulseContainer}>
                    <Text style={styles.liveTimer}>{formatTime(duration)}</Text>
                    <View style={styles.wavePlaceholder} />
                  </View>
                )}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.recordButton, isRecording && styles.recordButtonActive]}
                  onPress={isRecording ? stopRecording : startRecording}
                >
                  <View style={styles.recordButtonInner}>
                    <Text style={styles.micEmoji}>{isRecording ? "⏹️" : "🎙️"}</Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.voiceNote}>Keep it concise, under 60 seconds.</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.textSection}>
            <TextInput
              style={styles.textInput}
              multiline
              maxLength={300}
              placeholder="E.g., I will spend 2 hours writing the database schema and indexing script by 5 PM today."
              placeholderTextColor={colors.text.tertiary}
              value={rawText}
              onChangeText={setRawText}
            />
            <Text style={styles.charCount}>{rawText.length}/300</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {processing ? (
          <ActivityIndicator size="large" color={colors.accent.default} />
        ) : (
          <Button
            label={activeTab === "voice" ? "Transcribe & Rewrite with AI" : "Review with AI"}
            onPress={handleSubmit}
          />
        )}
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
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  categoryContainer: {
    marginVertical: 12,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  categoryPillSelected: {
    backgroundColor: colors.accent.default + "20",
    borderColor: colors.accent.default,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text.secondary,
  },
  categoryLabelSelected: {
    color: colors.accent.default,
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 24,
    marginVertical: 16,
    backgroundColor: colors.bg.card,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.bg.base,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text.tertiary,
  },
  tabTextActive: {
    color: colors.text.primary,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  voiceSection: {
    alignItems: "center",
  },
  recordedBox: {
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  recordedEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  recordedText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 8,
  },
  durationText: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginBottom: 20,
  },
  resetButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.accent.default,
  },
  resetButtonText: {
    color: colors.accent.default,
    fontSize: 13,
    fontWeight: "500",
  },
  recorderBox: {
    alignItems: "center",
    width: "100%",
  },
  recordInstruction: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: "500",
    marginBottom: 24,
    textAlign: "center",
  },
  pulseContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  liveTimer: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.accent.default,
  },
  wavePlaceholder: {
    width: 120,
    height: 4,
    backgroundColor: colors.accent.default,
    borderRadius: 2,
    marginTop: 8,
    opacity: 0.6,
  },
  recordButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.bg.card,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border.emphasis,
  },
  recordButtonActive: {
    borderColor: colors.accent.default,
    transform: [{ scale: 1.1 }],
  },
  recordButtonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.border.emphasis,
    justifyContent: "center",
    alignItems: "center",
  },
  micEmoji: {
    fontSize: 32,
  },
  voiceNote: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 24,
  },
  textSection: {
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
    height: 180,
  },
  textInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 15,
    textAlignVertical: "top",
  },
  charCount: {
    alignSelf: "flex-end",
    fontSize: 12,
    color: colors.text.tertiary,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
});
