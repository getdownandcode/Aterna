import React from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { Check, Edit3, X } from "lucide-react-native";
import { colors } from "@/constants/theme";
import { haptics } from "@/lib/haptics";

interface OutcomeButtonsProps {
  selected: "completed" | "partial" | "failed" | null;
  onSelect: (outcome: "completed" | "partial" | "failed") => void;
}

export function OutcomeButtons({ selected, onSelect }: OutcomeButtonsProps) {
  const options = [
    {
      id: "completed" as const,
      label: "Done ✓",
      sub: "I completed 100% of my goal today",
      color: colors.success.default,
      icon: Check,
    },
    {
      id: "partial" as const,
      label: "Partial ≈",
      sub: "I made partial progress today",
      color: colors.warning.default,
      icon: Edit3,
    },
    {
      id: "failed" as const,
      label: "Didn't do it ✕",
      sub: "I failed my goal completely",
      color: colors.danger.default,
      icon: X,
    },
  ];

  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const Icon = opt.icon;
        const isSelected = selected === opt.id;
        return (
          <Pressable
            key={opt.id}
            onPress={() => {
              haptics.medium();
              onSelect(opt.id);
            }}
            style={[
              styles.button,
              {
                borderColor: isSelected ? opt.color : colors.border.default,
                backgroundColor: isSelected ? opt.color + "15" : colors.bg.card,
              },
            ]}
          >
            <View style={[styles.iconWrapper, { backgroundColor: opt.color + "20" }]}>
              <Icon color={opt.color} size={22} />
            </View>
            <View style={styles.textWrapper}>
              <Text style={[styles.label, { color: isSelected ? opt.color : colors.text.primary }]}>
                {opt.label}
              </Text>
              <Text style={styles.sub}>{opt.sub}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    width: "100%",
  },
  button: {
    height: 72,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  textWrapper: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
  },
  sub: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
});
