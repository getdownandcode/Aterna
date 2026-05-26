import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";

interface PaymentStatusBadgeProps {
  status: string;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const getBadgeStyle = () => {
    switch (status) {
      case "released_success":
      case "refunded":
        return {
          bg: colors.success.bg,
          text: colors.success.default,
          label: "Returned",
        };
      case "partial":
        return {
          bg: colors.warning.bg,
          text: colors.warning.default,
          label: "Partial",
        };
      case "transferred_fail":
      case "payment_failed":
        return {
          bg: colors.danger.bg,
          text: colors.danger.default,
          label: status === "payment_failed" ? "Failed" : "Donated",
        };
      case "held":
        return {
          bg: colors.bg.input,
          text: colors.text.secondary,
          label: "Pending",
        };
      default:
        return {
          bg: colors.bg.input,
          text: colors.text.tertiary,
          label: status.toUpperCase(),
        };
    }
  };

  const badge = getBadgeStyle();

  return (
    <View style={[styles.badge, { backgroundColor: badge.bg, borderColor: badge.text + "30" }]}>
      <Text style={[styles.labelText, { color: badge.text }]}>{badge.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 0.5,
    alignSelf: "flex-start",
  },
  labelText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
