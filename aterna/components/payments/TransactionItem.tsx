import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { MaterialIcons } from "@expo/vector-icons";

interface CommitmentWithGoal {
  id: string;
  amount: number;
  status: string;
  razorpay_status: string;
  consequence_triggered_at: string | null;
  created_at: string;
  smart_text: string;
  goal_status: string;
  category: string;
  goal_date: string;
  consequence_type: string;
  consequence_target: string | null;
}

interface TransactionItemProps {
  commitment: CommitmentWithGoal;
}

const CATEGORY_ICONS = {
  work: "work",
  health: "favorite",
  learning: "school",
  creative: "palette",
  financial: "account-balance-wallet",
  personal: "person",
} as const;

export function TransactionItem({ commitment }: TransactionItemProps) {
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate();
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${day} ${months[d.getMonth()]}`;
    } catch (e) {
      return dateStr;
    }
  };

  const getCategoryLabel = (cat: string) => {
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  const getAmountColor = () => {
    switch (commitment.status) {
      case "released_success":
      case "refunded":
        return colors.success.default;
      case "partial":
        return colors.warning.default;
      case "transferred_fail":
        return colors.danger.default;
      default:
        return colors.text.primary;
    }
  };

  return (
    <View style={styles.card}>
      {/* Top row: Date & Status Pill */}
      <View style={styles.topRow}>
        <View style={styles.dateSection}>
          <MaterialIcons name="event" size={13} color={colors.text.tertiary} style={styles.calendarIcon} />
          <Text style={styles.dateText}>{formatDate(commitment.created_at)}</Text>
        </View>
        <PaymentStatusBadge status={commitment.status} />
      </View>

      {/* Goal Text */}
      <Text style={styles.goalText} numberOfLines={2}>
        “{commitment.smart_text}”
      </Text>

      {/* Footer details row */}
      <View style={styles.footerRow}>
        <View style={styles.leftMeta}>
          <View style={styles.categoryBadge}>
            <MaterialIcons
              name={CATEGORY_ICONS[commitment.category as keyof typeof CATEGORY_ICONS] || "star"}
              size={11}
              color={colors.accent.light}
            />
            <Text style={styles.categoryText}>{getCategoryLabel(commitment.category)}</Text>
          </View>

          {commitment.status === "transferred_fail" && commitment.consequence_target && (
            <Text style={styles.targetText} numberOfLines={1}>
              → {commitment.consequence_target}
            </Text>
          )}
        </View>

        <Text style={[styles.amountValue, { color: getAmountColor() }]}>
          ₹{commitment.amount}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 0.5,
    borderColor: colors.border.default,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  dateSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  calendarIcon: {
    marginRight: 4,
  },
  dateText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: "500",
  },
  goalText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
    lineHeight: 20,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftMeta: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg.base,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: colors.border.default,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.accent.light,
    marginLeft: 4,
  },
  targetText: {
    fontSize: 11,
    color: colors.text.tertiary,
    maxWidth: 120,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "700",
  },
});
