import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";
import { haptics } from "@/lib/haptics";

interface CheckinButtonsProps {
  onDone: () => void;
  onPartial: () => void;
  onFailed: () => void;
}

export function CheckinButtons({ onDone, onPartial, onFailed }: CheckinButtonsProps) {
  const handleDone = () => {
    haptics.success();
    onDone();
  };

  const handlePartial = () => {
    haptics.warning();
    onPartial();
  };

  const handleFailed = () => {
    haptics.error();
    onFailed();
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={handleDone} style={[styles.button, styles.done]}>
        <Text style={styles.buttonText}>Done</Text>
      </Pressable>
      <Pressable onPress={handlePartial} style={[styles.button, styles.partial]}>
        <Text style={styles.buttonText}>Partial</Text>
      </Pressable>
      <Pressable onPress={handleFailed} style={[styles.button, styles.failed]}>
        <Text style={styles.buttonText}>Didn&apos;t do it</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  button: {
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  done: {
    backgroundColor: colors.success.default,
  },
  partial: {
    backgroundColor: colors.warning.default,
  },
  failed: {
    backgroundColor: colors.danger.default,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.bg.base,
  },
});
