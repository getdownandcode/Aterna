import React from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";
import { haptics } from "@/lib/haptics";

interface ReasonChipsProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

const REASONS = [
  "Got distracted",
  "Work overran",
  "Low energy",
  "Goal was too big",
  "Personal stuff came up",
  "Forgot",
  "Lost motivation",
  "Technical issues",
];

export function ReasonChips({ selected, onChange }: ReasonChipsProps) {
  const handleToggle = (reason: string) => {
    haptics.light();
    if (selected.includes(reason)) {
      onChange(selected.filter((r) => r !== reason));
    } else {
      onChange([...selected, reason]);
    }
  };

  return (
    <View style={styles.container}>
      {REASONS.map((reason) => {
        const isSelected = selected.includes(reason);
        return (
          <Pressable
            key={reason}
            onPress={() => handleToggle(reason)}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? colors.danger.bg : colors.bg.card,
                borderColor: isSelected ? colors.danger.default : colors.border.default,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: isSelected ? colors.danger.default : colors.text.primary },
              ]}
            >
              {reason}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    width: "100%",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
});
