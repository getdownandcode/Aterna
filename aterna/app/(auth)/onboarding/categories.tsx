import React, { useState } from "react";
import { View, Text, SafeAreaView, StyleSheet, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { MaterialIcons } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";
import { colors } from "@/constants/theme";
import type { GoalCategory } from "@/types/database";

const CATEGORIES: { label: string; value: GoalCategory; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { label: "Work", value: "work", icon: "work" },
  { label: "Health", value: "health", icon: "favorite" },
  { label: "Learning", value: "learning", icon: "school" },
  { label: "Creative", value: "creative", icon: "palette" },
  { label: "Financial", value: "financial", icon: "account-balance-wallet" },
  { label: "Personal", value: "personal", icon: "person" },
];

export default function Categories() {
  const [selected, setSelected] = useState<GoalCategory[]>([]);
  const router = useRouter();

  const toggle = (value: GoalCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleNext = () => {
    if (selected.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/onboarding/payment");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.stepText}>STEP 1 OF 3</Text>
          <Text style={styles.heading}>What do you want to achieve?</Text>
          <Text style={styles.subheading}>
            Select the primary areas you want to focus your habits on.
          </Text>
        </View>

        {/* Bento Style Grid */}
        <View style={styles.grid}>
          {CATEGORIES.map((cat) => {
            const isSelected = selected.includes(cat.value);
            return (
              <Pressable
                key={cat.value}
                onPress={() => toggle(cat.value)}
                style={[
                  styles.card,
                  isSelected && styles.cardSelected,
                ]}
              >
                {isSelected && (
                  <View style={styles.checkedIndicator}>
                    <MaterialIcons name="check-circle" size={20} color={colors.accent.default} />
                  </View>
                )}
                
                <View style={[
                  styles.iconContainer,
                  isSelected && styles.iconContainerSelected
                ]}>
                  <MaterialIcons 
                    name={cat.icon} 
                    size={28} 
                    color={isSelected ? colors.accent.default : colors.text.secondary} 
                  />
                </View>
                
                <Text style={[
                  styles.cardLabel,
                  isSelected && styles.cardLabelSelected
                ]}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Bottom Navigation Section */}
        <View style={styles.footerSection}>
          {/* Progress Indicators */}
          <View style={styles.progressRow}>
            <View style={styles.progressLineActive} />
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
          </View>

          <Button
            label="Continue"
            onPress={handleNext}
            disabled={selected.length === 0}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 36,
    flexGrow: 1,
    justifyContent: "space-between",
  },
  header: {
    marginBottom: 24,
  },
  stepText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text.tertiary,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  card: {
    width: "48%",
    aspectRatio: 1,
    backgroundColor: colors.bg.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    padding: 16,
  },
  cardSelected: {
    borderColor: colors.accent.default,
    backgroundColor: colors.accent.default + "10",
  },
  checkedIndicator: {
    position: "absolute",
    top: 14,
    right: 14,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.bg.input,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  iconContainerSelected: {
    backgroundColor: colors.accent.default + "20",
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  cardLabelSelected: {
    color: colors.accent.default,
    fontWeight: "700",
  },
  footerSection: {
    alignItems: "center",
    marginTop: "auto",
    gap: 20,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  progressLineActive: {
    width: 32,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent.default,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border.emphasis,
  },
});
