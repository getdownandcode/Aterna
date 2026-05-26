import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { colors } from "@/constants/theme";

interface DebriefCardProps {
  text: string | null;
  variant: "success" | "partial" | "failed";
  loading: boolean;
}

export function DebriefCard({ text, variant, loading }: DebriefCardProps) {
  const [displayedText, setDisplayedText] = useState("");

  const cardColors = {
    success: colors.success.default,
    partial: colors.warning.default,
    failed: colors.danger.default,
  };

  const defaultTexts = {
    success: "You showed up and smashed your commitment. Keep building this momentum!",
    partial: "You made progress today. Take this intermediate victory and recalibrate for tomorrow.",
    failed: "You missed your mark today, but showing up to own it is where real growth starts. Start fresh tomorrow.",
  };

  const selectedColor = cardColors[variant];
  const contentText = text || defaultTexts[variant];

  useEffect(() => {
    if (loading || !contentText) {
      setDisplayedText("");
      return;
    }

    let currentIndex = 0;
    setDisplayedText("");

    const interval = setInterval(() => {
      if (currentIndex < contentText.length) {
        setDisplayedText((prev) => prev + contentText.charAt(currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [contentText, loading]);

  return (
    <View style={[styles.card, { borderLeftColor: selectedColor }]}>
      <Text style={[styles.title, { color: selectedColor }]}>🤖 ATERNA AI DEBRIEF</Text>
      
      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator color={selectedColor} size="small" />
          <Text style={styles.loadingText}>Coaching AI is analyzing your performance...</Text>
        </View>
      ) : (
        <Text style={styles.text}>{displayedText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderLeftWidth: 4,
    width: "100%",
    minHeight: 120,
    justifyContent: "center",
  },
  title: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.text.primary,
  },
  loadingWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  loadingText: {
    fontSize: 13,
    color: colors.text.secondary,
    flex: 1,
  },
});
