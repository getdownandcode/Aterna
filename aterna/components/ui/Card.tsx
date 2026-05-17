import React from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";

interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "success" | "warning" | "danger";
  style?: object;
  padding?: number;
}

const CARD_STYLES = {
  default: { bg: colors.bg.card, border: colors.border.default },
  accent: { bg: colors.accent.bg, border: "#3D3860" },
  success: { bg: colors.success.bg, border: "#2A6B44" },
  warning: { bg: colors.warning.bg, border: "#6B4F20" },
  danger: { bg: colors.danger.bg, border: "#6B3020" },
} as const;

export function Card({ children, variant = "default", style, padding = 16 }: CardProps) {
  const cardStyle = CARD_STYLES[variant];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardStyle.bg,
          borderColor: cardStyle.border,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 0.5,
  },
});
