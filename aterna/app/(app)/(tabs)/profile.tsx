import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Platform,
  StatusBar,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/constants/theme";
import { useAuth } from "@clerk/clerk-expo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useUser } from "@/hooks/useUser";
import { getSupabase } from "@/lib/supabase";
import { haptics } from "@/lib/haptics";
import { requestPermission } from "@/lib/notifications";
import { MaterialIcons } from "@expo/vector-icons";

export default function Profile() {
  const router = useRouter();
  const { signOut, getToken } = useAuth();
  const { dbUser, refetch: refetchUser } = useUser();

  const [saving, setSaving] = useState(false);
  const [morningTime, setMorningTime] = useState(dbUser?.morning_time?.substring(0, 5) || "08:00");
  const [checkinTime, setCheckinTime] = useState(dbUser?.checkin_time?.substring(0, 5) || "21:00");

  const [editingMorning, setEditingMorning] = useState(false);
  const [editingCheckin, setEditingCheckin] = useState(false);

  const handleUpdateTone = async (tone: "gentle" | "balanced" | "tough") => {
    if (!dbUser) return;
    haptics.medium();
    setSaving(true);
    try {
      const supabaseClient = await getSupabase(getToken);
      const { error } = await supabaseClient
        .from("users")
        .update({ ai_tone: tone, updated_at: new Date().toISOString() })
        .eq("id", dbUser.id);

      if (error) throw error;
      haptics.success();
      await refetchUser();
    } catch (err) {
      console.error("[Profile] Failed to update AI tone:", err);
      haptics.error();
      Alert.alert("Error", "Could not save AI tone. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotifications = async () => {
    if (!dbUser) return;
    haptics.medium();
    try {
      // If notification token exists, mock toggle off, else request permission
      const nextToken = dbUser.expo_push_token ? null : "mock_expo_push_token_for_expo_go";
      const supabaseClient = await getSupabase(getToken);
      
      if (nextToken) {
        // Run full request permissions
        const result = await requestPermission(dbUser.clerk_id);
        if (result === "granted") {
          haptics.success();
          Alert.alert("Notifications Enabled", "You will now receive reminders for your accountability windows.");
        }
      } else {
        const { error } = await supabaseClient
          .from("users")
          .update({ expo_push_token: null })
          .eq("id", dbUser.id);
        if (error) throw error;
        haptics.success();
      }
      await refetchUser();
    } catch (err) {
      console.error("[Profile] Toggle notifications failed:", err);
      haptics.error();
    }
  };

  const handleSaveTimes = async () => {
    if (!dbUser) return;
    
    // Simple HH:MM validation
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(morningTime) || !timeRegex.test(checkinTime)) {
      haptics.error();
      Alert.alert("Invalid Time Format", "Please enter times in 24-hour format (e.g., 08:30 or 21:15).");
      return;
    }

    haptics.medium();
    setSaving(true);
    try {
      const supabaseClient = await getSupabase(getToken);
      const { error } = await supabaseClient
        .from("users")
        .update({
          morning_time: `${morningTime}:00`,
          checkin_time: `${checkinTime}:00`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", dbUser.id);

      if (error) throw error;
      haptics.success();
      setEditingMorning(false);
      setEditingCheckin(false);
      await refetchUser();
      Alert.alert("Times Saved", "Your morning goal declaration and evening check-in times have been updated.");
    } catch (err) {
      console.error("[Profile] Failed to save rhythm times:", err);
      haptics.error();
      Alert.alert("Error", "Could not save rhythm times. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const format12h = (timeStr: string) => {
    const [hStr, mStr] = timeStr.split(":");
    const h = parseInt(hStr, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const formattedHour = h12 < 10 ? `0${h12}` : h12;
    return `${formattedHour}:${mStr} ${ampm}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile Settings</Text>
          <Text style={styles.subtitle}>Customize your accountability coach and preferences</Text>
        </View>

        {/* User Card */}
        {dbUser && (
          <Card variant="accent" style={styles.userCard}>
            <View style={styles.userRow}>
              <Image
                source={{
                  uri: dbUser.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
                }}
                style={styles.avatar}
              />
              <View style={styles.userDetails}>
                <Text style={styles.displayName}>{dbUser.display_name || "Accountability Member"}</Text>
                <Text style={styles.email}>{dbUser.email}</Text>
                <View style={styles.tierBadge}>
                  <Text style={styles.tierBadgeText}>{dbUser.subscription_tier.toUpperCase()} MEMBER</Text>
                </View>
              </View>
            </View>

            {/* Streak metrics */}
            <View style={styles.streakGrid}>
              <View style={styles.streakBox}>
                <Text style={styles.streakLabel}>CURRENT STREAK</Text>
                <View style={styles.valRow}>
                  <MaterialIcons name="whatshot" size={20} color={colors.warning.default} />
                  <Text style={styles.streakValue}> {dbUser.streak_current} days</Text>
                </View>
              </View>
              <View style={styles.streakDivider} />
              <View style={styles.streakBox}>
                <Text style={styles.streakLabel}>BEST STREAK</Text>
                <View style={styles.valRow}>
                  <MaterialIcons name="stars" size={20} color={colors.accent.light} />
                  <Text style={styles.streakValue}> {dbUser.streak_best} days</Text>
                </View>
              </View>
            </View>
          </Card>
        )}

        {/* AI Coach Settings Card */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🤖 AI COACH TONE</Text>
          <Text style={styles.sectionDesc}>
            Select how encouraging or demanding your AI coach should be during evening check-in debriefs.
          </Text>

          <View style={styles.toneButtonContainer}>
            {(["gentle", "balanced", "tough"] as const).map((tone) => {
              const isSelected = dbUser?.ai_tone === tone;
              return (
                <TouchableOpacity
                  key={tone}
                  activeOpacity={0.8}
                  onPress={() => handleUpdateTone(tone)}
                  style={[
                    styles.toneButton,
                    isSelected && styles.toneButtonActive,
                    tone === "gentle" && styles.leftToneBtn,
                    tone === "tough" && styles.rightToneBtn,
                  ]}
                >
                  <Text style={[styles.toneButtonText, isSelected && styles.toneButtonTextActive]}>
                    {tone.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Alarm and Timings Settings Card */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🌅 DAILY rhythm</Text>
          <Text style={styles.sectionDesc}>
            Configure times to declare morning goals and complete evening reflection windows.
          </Text>

          {/* Morning Timing */}
          <View style={styles.timingItem}>
            <View>
              <Text style={styles.timingLabel}>Goal Declaration (Morning)</Text>
              {editingMorning ? (
                <TextInput
                  style={styles.timeInput}
                  value={morningTime}
                  onChangeText={(text) => {
                    let cleaned = text.replace(/[^0-9:]/g, "");
                    if (cleaned.length === 2 && !cleaned.includes(":") && text.length > 1) {
                      cleaned = cleaned + ":";
                    }
                    setMorningTime(cleaned);
                  }}
                  maxLength={5}
                  keyboardType="numeric"
                  placeholder="HH:MM"
                />
              ) : (
                <Text style={styles.timeLabel}>{format12h(dbUser?.morning_time?.substring(0, 5) || "08:00")}</Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => {
                haptics.light();
                if (editingMorning) {
                  handleSaveTimes();
                } else {
                  setEditingMorning(true);
                }
              }}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>{editingMorning ? "Save" : "Edit"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Evening Timing */}
          <View style={styles.timingItem}>
            <View>
              <Text style={styles.timingLabel}>Reflection Check-in (Evening)</Text>
              {editingCheckin ? (
                <TextInput
                  style={styles.timeInput}
                  value={checkinTime}
                  onChangeText={(text) => {
                    let cleaned = text.replace(/[^0-9:]/g, "");
                    if (cleaned.length === 2 && !cleaned.includes(":") && text.length > 1) {
                      cleaned = cleaned + ":";
                    }
                    setCheckinTime(cleaned);
                  }}
                  maxLength={5}
                  keyboardType="numeric"
                  placeholder="HH:MM"
                />
              ) : (
                <Text style={styles.timeLabel}>{format12h(dbUser?.checkin_time?.substring(0, 5) || "21:00")}</Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => {
                haptics.light();
                if (editingCheckin) {
                  handleSaveTimes();
                } else {
                  setEditingCheckin(true);
                }
              }}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>{editingCheckin ? "Save" : "Edit"}</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Notifications and Safety Settings Card */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🔔 SYSTEM PREFERENCES</Text>
          
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleToggleNotifications}
            style={styles.preferenceRow}
          >
            <View>
              <Text style={styles.preferenceLabel}>Push Notifications</Text>
              <Text style={styles.preferenceDesc}>Receive alerts to check in before consequence triggers</Text>
            </View>
            <MaterialIcons
              name={dbUser?.expo_push_token ? "toggle-on" : "toggle-off"}
              size={36}
              color={dbUser?.expo_push_token ? colors.success.default : colors.text.tertiary}
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              haptics.light();
              router.push("/profile/transactions");
            }}
            style={styles.preferenceRow}
          >
            <View>
              <Text style={styles.preferenceLabel}>Transaction History</Text>
              <Text style={styles.preferenceDesc}>View past stakes, returned funds, and consequence transfers</Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={colors.text.secondary}
            />
          </TouchableOpacity>
        </Card>

        {/* Sign Out Action Button */}
        <View style={styles.buttonContainer}>
          <Button
            label="Sign Out"
            variant="danger"
            onPress={() => {
              haptics.heavy();
              signOut();
            }}
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
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  userCard: {
    marginBottom: 16,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  userDetails: {
    flex: 1,
  },
  displayName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.primary,
  },
  email: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  tierBadge: {
    backgroundColor: colors.accent.bg,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: colors.border.accent,
    marginTop: 8,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.accent.light,
    letterSpacing: 0.5,
  },
  streakGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.bg.base,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 0.5,
    borderColor: colors.border.default,
  },
  streakBox: {
    flex: 1,
    alignItems: "center",
  },
  streakLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.text.tertiary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  valRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  streakValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text.primary,
  },
  streakDivider: {
    width: 0.5,
    height: 24,
    backgroundColor: colors.border.default,
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text.tertiary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  toneButtonContainer: {
    flexDirection: "row",
    width: "100%",
  },
  toneButton: {
    flex: 1,
    height: 44,
    backgroundColor: colors.bg.base,
    borderWidth: 0.5,
    borderColor: colors.border.default,
    justifyContent: "center",
    alignItems: "center",
  },
  leftToneBtn: {
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderRightWidth: 0,
  },
  rightToneBtn: {
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderLeftWidth: 0,
  },
  toneButtonActive: {
    backgroundColor: colors.accent.bg,
    borderColor: colors.border.accent,
    borderWidth: 1,
  },
  toneButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  toneButtonTextActive: {
    color: colors.accent.light,
    fontWeight: "700",
  },
  timingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  timingLabel: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: "500",
  },
  timeLabel: {
    fontSize: 16,
    color: colors.accent.light,
    fontWeight: "700",
    marginTop: 4,
  },
  timeInput: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: "700",
    marginTop: 4,
    backgroundColor: colors.bg.base,
    borderWidth: 0.5,
    borderColor: colors.border.default,
    borderRadius: 6,
    width: 80,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.bg.input,
    borderWidth: 0.5,
    borderColor: colors.border.default,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  divider: {
    height: 0.5,
    backgroundColor: colors.border.default,
    marginVertical: 12,
  },
  preferenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
  },
  preferenceDesc: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
    maxWidth: "80%",
  },
  buttonContainer: {
    marginTop: 16,
    width: "100%",
  },
});
