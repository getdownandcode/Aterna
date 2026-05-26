import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from "react-native-reanimated";
import { Award, Flame } from "lucide-react-native";
import { colors } from "@/constants/theme";

interface StreakCelebrationProps {
  streakCount: number;
  isMilestone: boolean;
}

export function StreakCelebration({ streakCount, isMilestone }: StreakCelebrationProps) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(200, withSpring(1, { damping: 12 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.badgeWrapper}>
        <View style={styles.iconCircle}>
          <Flame color={colors.warning.default} size={36} fill={colors.warning.default} />
        </View>
        
        <View style={styles.textColumn}>
          <Text style={styles.streakNumber}>{streakCount}</Text>
          <Text style={styles.streakLabel}>{streakCount === 1 ? "DAY STREAK" : "DAYS STREAK"}</Text>
        </View>
      </View>

      {isMilestone && (
        <View style={styles.milestoneBadge}>
          <Award color="#FFFFFF" size={16} />
          <Text style={styles.milestoneText}>🎯 {streakCount}-DAY MILESTONE!</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
    width: "100%",
  },
  badgeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
    shadowColor: colors.warning.default,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.warning.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  textColumn: {
    justifyContent: "center",
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.text.primary,
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.warning.default,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  milestoneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accent.default,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 16,
  },
  milestoneText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
});
