import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Platform,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { colors } from "@/constants/theme";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { haptics } from "@/lib/haptics";
import { MaterialIcons } from "@expo/vector-icons";

type TimeRange = "7d" | "30d" | "all";

export default function Insights() {
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  const handleTimeRangeChange = (range: TimeRange) => {
    haptics.light();
    setTimeRange(range);
  };

  // Mock stats corresponding to timeRange
  const getStats = () => {
    switch (timeRange) {
      case "7d":
        return {
          successRate: 85,
          totalStakes: 4250,
          forfeited: 425,
          declared: 7,
          completed: 6,
          failed: 1,
        };
      case "30d":
        return {
          successRate: 90,
          totalStakes: 16150,
          forfeited: 850,
          declared: 30,
          completed: 27,
          failed: 3,
        };
      default:
        return {
          successRate: 92,
          totalStakes: 38250,
          forfeited: 1700,
          declared: 54,
          completed: 50,
          failed: 4,
        };
    }
  };

  const stats = getStats();

  const CATEGORY_STATS = [
    { label: "Health & Fitness", count: 20, pct: 40, color: colors.success.default },
    { label: "Work & Career", count: 15, pct: 30, color: colors.accent.default },
    { label: "Learning & School", count: 10, pct: 20, color: colors.warning.default },
    { label: "Creative Habits", count: 5, pct: 10, color: colors.accent.light },
  ];

  const FAILED_REASONS = [
    { label: "Fatigue & Low Energy", count: 2, pct: 50 },
    { label: "Time Management / Busy", count: 1, pct: 25 },
    { label: "Procrastination", count: 1, pct: 25 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Insights</Text>
          <Text style={styles.subtitle}>Track your success and stakes over time</Text>
        </View>

        {/* Time filters */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterTab, timeRange === "7d" && styles.filterTabActive]}
            onPress={() => handleTimeRangeChange("7d")}
          >
            <Text style={[styles.filterTabText, timeRange === "7d" && styles.filterTabTextActive]}>7 DAYS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, timeRange === "30d" && styles.filterTabActive]}
            onPress={() => handleTimeRangeChange("30d")}
          >
            <Text style={[styles.filterTabText, timeRange === "30d" && styles.filterTabTextActive]}>30 DAYS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, timeRange === "all" && styles.filterTabActive]}
            onPress={() => handleTimeRangeChange("all")}
          >
            <Text style={[styles.filterTabText, timeRange === "all" && styles.filterTabTextActive]}>ALL TIME</Text>
          </TouchableOpacity>
        </View>

        {/* Big Stats Row */}
        <View style={styles.statsGrid}>
          <Card variant="accent" style={styles.statCardHalf}>
            <Text style={styles.statLabel}>SUCCESS RATE</Text>
            <View style={styles.valIconRow}>
              <Text style={styles.statValLarge}>{stats.successRate}%</Text>
              <MaterialIcons name="trending-up" size={24} color={colors.accent.light} />
            </View>
            <Text style={styles.statDesc}>
              {stats.completed} of {stats.declared} goals completed
            </Text>
          </Card>

          <Card style={styles.statCardHalf}>
            <Text style={styles.statLabel}>STAKES SAVED</Text>
            <View style={styles.valIconRow}>
              <Text style={[styles.statValLarge, { color: colors.success.default }]}>
                ₹{stats.totalStakes.toLocaleString("en-IN")}
              </Text>
              <MaterialIcons name="security" size={24} color={colors.success.default} />
            </View>
            <Text style={styles.statDesc}>₹{stats.forfeited} forfeited to consequence</Text>
          </Card>
        </View>

        {/* Weekly activity mock matrix */}
        <Card style={styles.chartCard}>
          <Text style={styles.cardHeader}>WEEKLY HABIT RHYTHM</Text>
          <View style={styles.activityRow}>
            {["M", "T", "W", "T", "F", "S", "S"].map((day, idx) => {
              const isMissed = idx === 3; // Mock Thursday missed
              return (
                <View key={day + idx} style={styles.activityDayCol}>
                  <View
                    style={[
                      styles.activityGridBox,
                      isMissed ? styles.activityBoxMissed : styles.activityBoxSuccess,
                    ]}
                  >
                    <MaterialIcons
                      name={isMissed ? "close" : "check"}
                      size={14}
                      color={isMissed ? colors.danger.default : "#FFFFFF"}
                    />
                  </View>
                  <Text style={styles.activityDayLabel}>{day}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Habits category breakdown */}
        <Card style={styles.chartCard}>
          <Text style={styles.cardHeader}>HABIT CATEGORIES FOCUS</Text>
          <View style={styles.barList}>
            {CATEGORY_STATS.map((item) => (
              <View key={item.label} style={styles.barItem}>
                <View style={styles.barInfoRow}>
                  <Text style={styles.barLabel}>{item.label}</Text>
                  <Text style={styles.barCount}>{item.count} goals</Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${item.pct}%`, backgroundColor: item.color },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Missed reasons card */}
        {stats.failed > 0 && (
          <Card variant="danger" style={styles.chartCard}>
            <Text style={[styles.cardHeader, { color: colors.danger.default }]}>
              MISSED GOALS DIAGNOSTICS
            </Text>
            <Text style={styles.failureNote}>
              AI detected energy depletion and scheduling conflicts as your main bottlenecks.
            </Text>
            <View style={styles.barList}>
              {FAILED_REASONS.map((item) => (
                <View key={item.label} style={styles.barItem}>
                  <View style={styles.barInfoRow}>
                    <Text style={styles.barLabel}>{item.label}</Text>
                    <Text style={styles.barCount}>{item.pct}% of misses</Text>
                  </View>
                  <View style={[styles.barTrack, { backgroundColor: "#3A1A14" }]}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${item.pct}%`, backgroundColor: colors.danger.default },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </Card>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  header: {
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
  filterRow: {
    flexDirection: "row",
    backgroundColor: colors.bg.card,
    borderRadius: 10,
    padding: 3,
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: colors.border.default,
  },
  filterTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: colors.bg.input,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text.tertiary,
    letterSpacing: 0.5,
  },
  filterTabTextActive: {
    color: colors.text.primary,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCardHalf: {
    width: "48%",
    justifyContent: "space-between",
    minHeight: 120,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text.tertiary,
    letterSpacing: 0.5,
  },
  valIconRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 6,
  },
  statValLarge: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text.primary,
  },
  statDesc: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  chartCard: {
    marginBottom: 16,
  },
  cardHeader: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text.tertiary,
    letterSpacing: 1,
    marginBottom: 16,
  },
  activityRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
  },
  activityDayCol: {
    alignItems: "center",
  },
  activityGridBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  activityBoxSuccess: {
    backgroundColor: colors.success.default,
  },
  activityBoxMissed: {
    backgroundColor: colors.danger.bg,
    borderWidth: 0.5,
    borderColor: colors.danger.default,
  },
  activityDayLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  barList: {
    gap: 14,
  },
  barItem: {
    width: "100%",
  },
  barInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  barLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text.primary,
  },
  barCount: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  barTrack: {
    height: 8,
    backgroundColor: colors.bg.input,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
  },
  failureNote: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: 16,
  },
});
