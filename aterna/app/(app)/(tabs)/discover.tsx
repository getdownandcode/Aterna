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
  FlatList,
} from "react-native";
import { colors } from "@/constants/theme";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { haptics } from "@/lib/haptics";
import { MaterialIcons } from "@expo/vector-icons";

interface FeedItem {
  id: string;
  userName: string;
  avatarUrl: string;
  goal: string;
  category: "work" | "health" | "learning" | "creative" | "financial" | "personal";
  stake: number;
  streak: number;
  status: "active" | "completed" | "failed";
  timeAgo: string;
  cheers: number;
  hasCheered: boolean;
  hasNudged: boolean;
}

const INITIAL_FEED: FeedItem[] = [
  {
    id: "feed-1",
    userName: "Marcus Vance",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    goal: "Complete my React Native notifications implementation plan & review it",
    category: "work",
    stake: 25,
    streak: 8,
    status: "active",
    timeAgo: "12m ago",
    cheers: 14,
    hasCheered: false,
    hasNudged: false,
  },
  {
    id: "feed-2",
    userName: "Elena Rostova",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
    goal: "Run 10km track session under 50 minutes at sunset",
    category: "health",
    stake: 50,
    streak: 15,
    status: "completed",
    timeAgo: "1h ago",
    cheers: 32,
    hasCheered: false,
    hasNudged: false,
  },
  {
    id: "feed-3",
    userName: "Jared Chen",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    goal: "Decline refined sugars and log only clean meals today",
    category: "health",
    stake: 15,
    streak: 0,
    status: "failed",
    timeAgo: "2h ago",
    cheers: 3,
    hasCheered: false,
    hasNudged: false,
  },
  {
    id: "feed-4",
    userName: "Aria Thorne",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    goal: "Sketch 3 new wireframes for Aterna accountability feeds",
    category: "creative",
    stake: 30,
    streak: 4,
    status: "active",
    timeAgo: "3h ago",
    cheers: 9,
    hasCheered: false,
    hasNudged: false,
  },
  {
    id: "feed-5",
    userName: "Devon Miller",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    goal: "Study 2 hours of advanced data structures for technical interview",
    category: "learning",
    stake: 40,
    streak: 21,
    status: "completed",
    timeAgo: "5h ago",
    cheers: 45,
    hasCheered: false,
    hasNudged: false,
  },
];

const CATEGORY_ICONS = {
  work: "work",
  health: "favorite",
  learning: "school",
  creative: "palette",
  financial: "account-balance-wallet",
  personal: "person",
} as const;

export default function Discover() {
  const [feed, setFeed] = useState<FeedItem[]>(INITIAL_FEED);

  const handleCheer = (id: string) => {
    setFeed((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newHasCheered = !item.hasCheered;
          if (newHasCheered) {
            haptics.success();
          } else {
            haptics.light();
          }
          return {
            ...item,
            hasCheered: newHasCheered,
            cheers: newHasCheered ? item.cheers + 1 : item.cheers - 1,
          };
        }
        return item;
      })
    );
  };

  const handleNudge = (id: string) => {
    haptics.medium();
    setFeed((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            hasNudged: true,
          };
        }
        return item;
      })
    );
  };

  const renderStatusBadge = (status: "active" | "completed" | "failed") => {
    switch (status) {
      case "completed":
        return (
          <View style={[styles.statusBadge, styles.statusSuccess]}>
            <MaterialIcons name="check-circle" size={12} color={colors.success.default} />
            <Text style={[styles.statusBadgeText, { color: colors.success.default }]}>COMPLETED</Text>
          </View>
        );
      case "failed":
        return (
          <View style={[styles.statusBadge, styles.statusDanger]}>
            <MaterialIcons name="cancel" size={12} color={colors.danger.default} />
            <Text style={[styles.statusBadgeText, { color: colors.danger.default }]}>FORFEITED</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.statusBadge, styles.statusActive]}>
            <View style={styles.pulseDot} />
            <Text style={[styles.statusBadgeText, { color: colors.accent.light }]}>ACTIVE</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>Explore accountability contracts in the Aterna network</Text>
      </View>

      <FlatList
        data={feed}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Card variant={item.status === "failed" ? "danger" : item.status === "completed" ? "success" : "default"} style={styles.feedCard}>
            {/* Top User Row */}
            <View style={styles.userRow}>
              <View style={styles.userInfo}>
                <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                <View>
                  <View style={styles.nameStreakRow}>
                    <Text style={styles.userName}>{item.userName}</Text>
                    {item.streak > 0 && (
                      <View style={styles.streakBadge}>
                        <MaterialIcons name="whatshot" size={13} color={colors.warning.default} />
                        <Text style={styles.streakText}>{item.streak}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.timeAgo}>{item.timeAgo}</Text>
                </View>
              </View>
              {renderStatusBadge(item.status)}
            </View>

            {/* Goal Text */}
            <Text style={styles.goalText}>“{item.goal}”</Text>

            {/* Details Row */}
            <View style={styles.detailsRow}>
              <View style={styles.categoryPill}>
                <MaterialIcons name={CATEGORY_ICONS[item.category]} size={14} color={colors.accent.light} />
                <Text style={styles.categoryLabel}>{item.category.toUpperCase()}</Text>
              </View>

              <View style={styles.stakeAmount}>
                <Text style={styles.stakeLabel}>STAKE:</Text>
                <Text style={styles.stakeValue}>₹{(item.stake * 85).toLocaleString("en-IN")}</Text>
              </View>
            </View>

            {/* Action Row */}
            <View style={styles.actionDivider} />
            <View style={styles.actionsRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleCheer(item.id)}
                style={[styles.actionButton, item.hasCheered && styles.actionButtonActive]}
              >
                <MaterialIcons
                  name="favorite"
                  size={18}
                  color={item.hasCheered ? "#FF2D55" : colors.text.secondary}
                />
                <Text style={[styles.actionButtonLabel, item.hasCheered && { color: "#FF2D55" }]}>
                  {item.cheers} {item.cheers === 1 ? "Cheer" : "Cheers"}
                </Text>
              </TouchableOpacity>

              {item.status === "active" && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => !item.hasNudged && handleNudge(item.id)}
                  disabled={item.hasNudged}
                  style={[styles.actionButton, item.hasNudged && styles.actionButtonDisabled]}
                >
                  <MaterialIcons
                    name={item.hasNudged ? "notifications-active" : "notifications-none"}
                    size={18}
                    color={item.hasNudged ? colors.accent.light : colors.text.secondary}
                  />
                  <Text style={[styles.actionButtonLabel, item.hasNudged && { color: colors.accent.light }]}>
                    {item.hasNudged ? "Nudged!" : "Nudge Checkin"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
    paddingTop: Platform.OS === "ios" ? 12 : (StatusBar.currentHeight || 0) + 12,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  feedCard: {
    marginBottom: 16,
  },
  userRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  nameStreakRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.warning.bg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
    borderWidth: 0.5,
    borderColor: "#4A3310",
  },
  streakText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.warning.default,
    marginLeft: 2,
  },
  timeAgo: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  statusSuccess: {
    backgroundColor: colors.success.bg,
    borderColor: "#235E39",
  },
  statusDanger: {
    backgroundColor: colors.danger.bg,
    borderColor: "#5E2519",
  },
  statusActive: {
    backgroundColor: colors.accent.bg,
    borderColor: "#3E2568",
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent.default,
  },
  goalText: {
    fontSize: 16,
    color: colors.text.primary,
    lineHeight: 22,
    marginVertical: 14,
    fontWeight: "500",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg.input,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: colors.border.default,
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.accent.light,
    marginLeft: 5,
  },
  stakeAmount: {
    flexDirection: "row",
    alignItems: "center",
  },
  stakeLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginRight: 6,
    fontWeight: "600",
  },
  stakeValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.success.default,
  },
  actionDivider: {
    height: 0.5,
    backgroundColor: colors.border.default,
    marginVertical: 12,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 4,
  },
  actionButtonActive: {
    // Styling when selected
  },
  actionButtonDisabled: {
    opacity: 0.8,
  },
  actionButtonLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    marginLeft: 6,
    fontWeight: "500",
  },
});
