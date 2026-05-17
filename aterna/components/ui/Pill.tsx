import React from "react";
import { Text, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";

interface PillProps {
  label: string;
  variant?: "default" | "accent" | "success" | "warning" | "danger";
  selected?: boolean;
  onPress?: () => void;
}

const PILL_COLORS = {
  default: { bg: colors.bg.input, text: colors.text.secondary },
  accent: { bg: colors.accent.bg, text: colors.accent.light },
  success: { bg: colors.success.bg, text: colors.success.default },
  warning: { bg: colors.warning.bg, text: colors.warning.default },
  danger: { bg: colors.danger.bg, text: colors.danger.default },
} as const;

export function Pill({ label, variant = "default", selected = false, onPress }: PillProps) {
  const pillColor = PILL_COLORS[variant];
  const isActive = selected || variant === "accent";

  return (
    <Text
      onPress={onPress}
      style={[
        styles.pill,
        {
          backgroundColor: isActive ? colors.accent.default : pillColor.bg,
          color: isActive ? "#FFFFFF" : pillColor.text,
          borderColor: isActive ? colors.accent.default : colors.border.default,
        },
      ]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 0.5,
    fontSize: 13,
    fontWeight: "500",
  },
});
