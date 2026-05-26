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
} from "react-native";
import { colors } from "@/constants/theme";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { haptics } from "@/lib/haptics";
import { MaterialIcons } from "@expo/vector-icons";

export default function Partner() {
  const [hasCheered, setHasCheered] = useState(false);
  const [cheerCount, setCheerCount] = useState(142);
  const [videoWatched, setVideoWatched] = useState(false);

  const handleCheer = () => {
    if (!hasCheered) {
      haptics.success();
      setHasCheered(true);
      setCheerCount((c) => c + 1);
    } else {
      haptics.light();
      setHasCheered(false);
      setCheerCount((c) => c - 1);
    }
  };

  const handleWatchVideo = () => {
    haptics.medium();
    setVideoWatched(true);
    Alert.alert(
      "Watching Partner Video",
      "Playing Marcus's evening async video: 'Woke up at 6am, completed my workout, finished client slides!'"
    );
  };

  const handleRecordVideo = () => {
    haptics.medium();
    Alert.alert(
      "Record Check-in Video",
      "Camera interface opening... Share a 30-second recap of your goals for the week."
    );
  };

  const handleRequestRepairing = () => {
    haptics.warning();
    Alert.alert(
      "Request New Buddy",
      "Are you sure you want to request a new accountability partner? You will be paired during the next cycle on Monday.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Request Pairing", style: "destructive", onPress: () => {
            haptics.success();
            Alert.alert("Request Submitted", "We're matching you with a new partner for next Monday!");
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Weekly Partner</Text>
          <Text style={styles.subtitle}>Your matched accountability buddy for this week</Text>
        </View>

        {/* Matched Partner Profile Card */}
        <Card variant="accent" style={styles.profileCard}>
          <View style={styles.userRow}>
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" }}
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <View style={styles.nameBadgeRow}>
                <Text style={styles.name}>Marcus Vance</Text>
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>PRO</Text>
                </View>
              </View>
              <Text style={styles.location}>Seattle, WA (PST)</Text>
              <Text style={styles.focus}>🎯 Health & Work focus</Text>
            </View>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>94%</Text>
              <Text style={styles.statLabel}>Success Rate</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <View style={styles.streakValRow}>
                <MaterialIcons name="whatshot" size={16} color={colors.warning.default} />
                <Text style={styles.statVal}> 12</Text>
              </View>
              <Text style={styles.statLabel}>Active Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>₹4.5K</Text>
              <Text style={styles.statLabel}>Stakes Kept</Text>
            </View>
          </View>
        </Card>

        {/* Today's Goal Section */}
        <Card style={styles.goalCard}>
          <Text style={styles.cardHeader}>MARCUS'S GOAL FOR TODAY</Text>
          <Text style={styles.goalText}>
            “Complete my React Native notifications implementation plan & review it”
          </Text>
          <View style={styles.stakeRow}>
            <MaterialIcons name="security" size={14} color={colors.success.default} style={styles.shieldIcon} />
            <Text style={styles.stakeText}>
              Staked: <Text style={styles.stakeAmount}>₹2,125</Text>
            </Text>
          </View>

          {/* Cheer / Nudge buttons */}
          <View style={styles.divider} />
          <View style={styles.socialActionRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleCheer}
              style={[styles.socialButton, hasCheered && styles.socialButtonActive]}
            >
              <MaterialIcons
                name="favorite"
                size={20}
                color={hasCheered ? "#FF2D55" : colors.text.secondary}
              />
              <Text style={[styles.socialButtonText, hasCheered && { color: "#FF2D55" }]}>
                {hasCheered ? "Cheered!" : "Send Cheer"} ({cheerCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleWatchVideo}
              style={[styles.socialButton, videoWatched && styles.socialButtonActive]}
            >
              <MaterialIcons
                name="play-circle-outline"
                size={20}
                color={videoWatched ? colors.accent.light : colors.text.secondary}
              />
              <Text style={[styles.socialButtonText, videoWatched && { color: colors.accent.light }]}>
                {videoWatched ? "Watched Video" : "Watch Check-in"}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Video checkin actions */}
        <Card style={styles.actionsCard}>
          <Text style={styles.cardHeader}>WEEKLY EXCHANGE (BODY DOUBLING)</Text>
          <Text style={styles.actionDesc}>
            Aterna matches you with an accountability peer to share a 30-second weekly progress check-in video. Exchange tips and keep streaks alive!
          </Text>
          
          <View style={styles.recordButtonContainer}>
            <Button
              label="Record Weekly Video Check-in"
              onPress={handleRecordVideo}
              variant="primary"
              fullWidth={true}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleRequestRepairing}
            style={styles.repairButton}
          >
            <MaterialIcons name="cached" size={16} color={colors.text.tertiary} />
            <Text style={styles.repairButtonText}>Request a new partner pairing</Text>
          </TouchableOpacity>
        </Card>
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
  profileCard: {
    marginBottom: 16,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
    borderWidth: 1.5,
    borderColor: colors.accent.default,
  },
  userDetails: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.primary,
  },
  premiumBadge: {
    backgroundColor: "#F1A80A",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 8,
  },
  premiumBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#0D0D0F",
  },
  location: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  focus: {
    fontSize: 13,
    color: colors.accent.light,
    fontWeight: "500",
    marginTop: 4,
  },
  statsRow: {
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
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statVal: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text.primary,
  },
  streakValRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 4,
    fontWeight: "500",
  },
  statDivider: {
    width: 0.5,
    height: 24,
    backgroundColor: colors.border.default,
  },
  goalCard: {
    marginBottom: 16,
  },
  cardHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text.tertiary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  goalText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    lineHeight: 22,
    marginBottom: 12,
  },
  stakeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  shieldIcon: {
    marginRight: 6,
  },
  stakeText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  stakeAmount: {
    fontWeight: "700",
    color: colors.success.default,
  },
  divider: {
    height: 0.5,
    backgroundColor: colors.border.default,
    marginVertical: 14,
  },
  socialActionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 4,
  },
  socialButtonActive: {
    // optional styles
  },
  socialButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text.secondary,
    marginLeft: 6,
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionDesc: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  recordButtonContainer: {
    marginBottom: 14,
  },
  repairButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  repairButtonText: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontWeight: "500",
    marginLeft: 6,
  },
});
