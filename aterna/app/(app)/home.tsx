import React from "react";
import { View, Text, SafeAreaView, StyleSheet, ScrollView } from "react-native";
import { StreakRing } from "@/components/goal/StreakRing";
import { Button } from "@/components/ui/Button";
import { colors } from "@/constants/theme";

export default function Home() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Good morning</Text>
          <StreakRing streak={0} />
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No goal yet today</Text>
          <Text style={styles.emptySubtitle}>
            Declare your goal and put something at stake.
          </Text>
        </View>

        <Button label="Set today's goal" onPress={() => {}} />
      </ScrollView>
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
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 20,
  },
  emptyState: {
    alignItems: "center",
    marginBottom: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: "center",
  },
});
