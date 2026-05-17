import React from "react";
import { View, Text, SafeAreaView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { colors } from "@/constants/theme";

export default function Payment() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.step}>Step 2 of 3</Text>
        <Text style={styles.heading}>Connect payment method</Text>
        <Text style={styles.subheading}>
          You&apos;ll need a payment method to stake money on your goals.
          You won&apos;t be charged until you set a stake.
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Free tier: max $5 per goal
            {"\n"}
            Pro tier: max $50 per goal
          </Text>
        </View>

        <Button label="Set up later" onPress={() => router.push("/onboarding/timing")} variant="ghost" />
        <View style={styles.spacer} />
        <Button label="Continue" onPress={() => router.push("/onboarding/timing")} />
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
    flex: 1,
    padding: 24,
    justifyContent: "center",
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
  infoCard: {
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: colors.border.default,
    padding: 20,
    marginBottom: 32,
  },
  infoText: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  spacer: {
    height: 16,
  },
});
