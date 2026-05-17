import React, { useState } from "react";
import { View, Text, SafeAreaView, StyleSheet, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { colors } from "@/constants/theme";
import type { GoalCategory } from "@/types/database";

const CATEGORIES: { label: string; value: GoalCategory }[] = [
  { label: "Work", value: "work" },
  { label: "Health", value: "health" },
  { label: "Learning", value: "learning" },
  { label: "Creative", value: "creative" },
  { label: "Financial", value: "financial" },
  { label: "Personal", value: "personal" },
];

export default function Categories() {
  const [selected, setSelected] = useState<GoalCategory[]>([]);
  const router = useRouter();

  const toggle = (value: GoalCategory) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleNext = () => {
    if (selected.length === 0) return;
    router.push("/onboarding/payment");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.step}>Step 1 of 3</Text>
        <Text style={styles.heading}>What are your goals about?</Text>
        <Text style={styles.subheading}>
          Select all that apply. We&apos;ll personalize your experience.
        </Text>

        <View style={styles.grid}>
          {CATEGORIES.map((cat) => {
            const isSelected = selected.includes(cat.value);
            return (
              <Pressable
                key={cat.value}
                onPress={() => toggle(cat.value)}
                style={[
                  styles.chip,
                  isSelected && styles.chipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected,
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Continue"
          onPress={handleNext}
          disabled={selected.length === 0}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  content: {
    padding: 24,
    flexGrow: 1,
  },
  step: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.accent.light,
    marginBottom: 8,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 15,
    color: colors.text.secondary,
    marginBottom: 32,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 0.5,
    borderColor: colors.border.default,
    backgroundColor: colors.bg.input,
  },
  chipSelected: {
    backgroundColor: colors.accent.default,
    borderColor: colors.accent.default,
  },
  chipText: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text.secondary,
  },
  chipTextSelected: {
    color: "#FFFFFF",
  },
  footer: {
    padding: 24,
    paddingBottom: 48,
  },
});
