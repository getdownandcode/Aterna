import React from "react";
import { View, Text, SafeAreaView, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";

export default function AiRewrite() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>AI SMART Rewrite</Text>
        <Text style={styles.subtitle}>
          Compare your original goal with the AI-rewritten SMART version.
        </Text>
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
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: "center",
  },
});
