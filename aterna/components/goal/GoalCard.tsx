import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card } from "@/components/ui/Card";
import { colors } from "@/constants/theme";
import type { Goal } from "@/types/database";

interface GoalCardProps {
  goal: Goal;
}

export function GoalCard({ goal }: GoalCardProps) {
  const displayText = goal.smart_text ?? goal.raw_text;

  return (
    <Card variant="accent" padding={20}>
      <Text style={styles.label}>Today&apos;s Goal</Text>
      <Text style={styles.text}>{displayText}</Text>
      <View style={styles.meta}>
        <Text style={styles.stake}>${goal.stake_amount.toFixed(2)} at stake</Text>
        <Text style={styles.category}>{goal.category}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.accent.light,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  text: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
    lineHeight: 26,
    marginBottom: 16,
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stake: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text.secondary,
  },
  category: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.text.tertiary,
    textTransform: "capitalize",
  },
});
