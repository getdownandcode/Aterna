import React, { useState } from "react";
import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import * as Haptics from "expo-haptics";
import { MaterialIcons } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";
import { colors } from "@/constants/theme";

export default function Timing() {
  const { user } = useUser();
  const [morningTime, setMorningTime] = useState("08:00");
  const [eveningTime, setEveningTime] = useState("21:00");

  // Custom picker expansion states
  const [editingMorning, setEditingMorning] = useState(false);
  const [editingEvening, setEditingEvening] = useState(false);

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Validate time string helper (HH:MM format)
  const isValidTime = (timeStr: string) => {
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(timeStr.trim());
  };

  const handleFinish = async (enableNotifications: boolean) => {
    if (!user) return;

    if (!isValidTime(morningTime)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Invalid Morning Time", "Please enter morning time in HH:MM format (between 00:00 and 23:59).");
      return;
    }

    if (!isValidTime(eveningTime)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Invalid Evening Time", "Please enter evening check-in time in HH:MM format (between 00:00 and 23:59).");
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          onboardingComplete: true,
          notificationsEnabled: enableNotifications,
          morning_time: morningTime,
          checkin_time: eveningTime,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/home");
    } catch (err) {
      console.error("[Timing] Failed to save onboarding:", err);
      Alert.alert("Error", "Could not save your rhythm. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to format time text input automatically
  const handleTimeChange = (text: string, setter: (val: string) => void) => {
    let cleaned = text.replace(/[^0-9:]/g, "");
    if (cleaned.length === 2 && !cleaned.includes(":") && text.length > 1) {
      cleaned = cleaned + ":";
    }
    setter(cleaned);
  };

  // Convert 24h to 12h label helper
  const format12h = (timeStr: string) => {
    if (!isValidTime(timeStr)) return timeStr;
    const [hStr, mStr] = timeStr.split(":");
    const h = parseInt(hStr, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const formattedHour = h12 < 10 ? `0${h12}` : h12;
    return `${formattedHour}:${mStr} ${ampm}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Progress Indicator Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.stepText}>STEP 3 OF 3</Text>
          <View style={styles.spacerHeader} />
        </View>

        {/* Heading */}
        <Text style={styles.heading}>Set your daily rhythm</Text>
        <Text style={styles.subheading}>
          Consistent timing is key to building lasting habits. When should we remind you?
        </Text>

        {/* Time pickers list */}
        <View style={styles.pickersList}>
          {/* Morning Goal Card */}
          <View style={styles.cardWrapper}>
            <TouchableOpacity
              style={[styles.timeCard, editingMorning && styles.timeCardActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setEditingMorning(!editingMorning);
                setEditingEvening(false);
              }}
            >
              <View style={styles.cardInfoCol}>
                <View style={styles.sunIconBox}>
                  <MaterialIcons name="wb-sunny" size={22} color={colors.accent.default} />
                </View>
                <View>
                  <Text style={styles.cardCategoryLabel}>MORNING GOAL</Text>
                  <Text style={styles.cardTimeVal}>{format12h(morningTime)}</Text>
                </View>
              </View>
              <MaterialIcons 
                name="edit" 
                size={20} 
                color={editingMorning ? colors.accent.default : colors.text.secondary} 
              />
            </TouchableOpacity>

            {editingMorning && (
              <View style={styles.customPicker}>
                <Text style={styles.pickerLabel}>Edit Morning reminder (HH:MM):</Text>
                <TextInput
                  style={styles.timeInput}
                  placeholder="08:00"
                  placeholderTextColor={colors.text.tertiary}
                  value={morningTime}
                  onChangeText={(text) => handleTimeChange(text, setMorningTime)}
                  keyboardType="number-pad"
                  maxLength={5}
                  textAlign="center"
                />
              </View>
            )}
          </View>

          {/* Evening Check-in Card */}
          <View style={styles.cardWrapper}>
            <TouchableOpacity
              style={[styles.timeCard, editingEvening && styles.timeCardActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setEditingEvening(!editingEvening);
                setEditingMorning(false);
              }}
            >
              <View style={styles.cardInfoCol}>
                <View style={styles.moonIconBox}>
                  <MaterialIcons name="bedtime" size={22} color={colors.accent.light} />
                </View>
                <View>
                  <Text style={styles.cardCategoryLabel}>EVENING CHECK-IN</Text>
                  <Text style={styles.cardTimeVal}>{format12h(eveningTime)}</Text>
                </View>
              </View>
              <MaterialIcons 
                name="edit" 
                size={20} 
                color={editingEvening ? colors.accent.light : colors.text.secondary} 
              />
            </TouchableOpacity>

            {editingEvening && (
              <View style={styles.customPicker}>
                <Text style={styles.pickerLabel}>Edit Check-in deadline (HH:MM):</Text>
                <TextInput
                  style={styles.timeInput}
                  placeholder="21:00"
                  placeholderTextColor={colors.text.tertiary}
                  value={eveningTime}
                  onChangeText={(text) => handleTimeChange(text, setEveningTime)}
                  keyboardType="number-pad"
                  maxLength={5}
                  textAlign="center"
                />
              </View>
            )}
          </View>

          {/* Timezone Info */}
          <View style={styles.timezoneRow}>
            <MaterialIcons name="location-on" size={16} color={colors.text.secondary} />
            <Text style={styles.timezoneText}>Timezone: Indian Standard Time (Detected)</Text>
          </View>
        </View>

        {/* Action Button Section */}
        <View style={styles.footerSection}>
          {/* Notifications Info Card */}
          <View style={styles.notificationsCallout}>
            <MaterialIcons name="notifications-active" size={20} color={colors.accent.default} style={styles.notifIcon} />
            <Text style={styles.notifText}>
              Allow notifications to receive gentle nudges for your morning goals and evening reflections. You can adjust these anytime.
            </Text>
          </View>

          {/* Progress Indicators */}
          <View style={styles.progressRow}>
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
            <View style={styles.progressLineActive} />
          </View>

          <Button
            label="Enable notifications"
            onPress={() => handleFinish(true)}
            disabled={loading}
          />
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={() => handleFinish(false)}
            disabled={loading}
          >
            <Text style={styles.skipText}>SKIP FOR NOW</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 16,
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: colors.border.default,
  },
  stepText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text.tertiary,
    letterSpacing: 1.5,
  },
  spacerHeader: {
    width: 40,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 28,
  },
  pickersList: {
    gap: 12,
    marginBottom: 24,
  },
  cardWrapper: {
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: "hidden",
  },
  timeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  timeCardActive: {
    backgroundColor: colors.bg.hover + "20",
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border.default,
  },
  cardInfoCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  sunIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent.default + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  moonIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent.light + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  cardCategoryLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text.tertiary,
    letterSpacing: 1.2,
  },
  cardTimeVal: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.primary,
    marginTop: 2,
  },
  customPicker: {
    padding: 16,
    backgroundColor: colors.bg.base + "40",
    alignItems: "center",
  },
  pickerLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 8,
    fontWeight: "500",
  },
  timeInput: {
    width: 120,
    height: 46,
    backgroundColor: colors.bg.input,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: colors.border.default,
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
    paddingHorizontal: 12,
  },
  timezoneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 6,
  },
  timezoneText: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontWeight: "500",
  },
  notificationsCallout: {
    backgroundColor: colors.bg.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  notifIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  notifText: {
    flex: 1,
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  footerSection: {
    alignItems: "center",
    marginTop: "auto",
    gap: 20,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border.emphasis,
  },
  progressLineActive: {
    width: 32,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent.default,
  },
  skipButton: {
    paddingVertical: 10,
  },
  skipText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text.secondary,
    letterSpacing: 1.5,
  },
});
