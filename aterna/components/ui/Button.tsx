import React from "react";
import { Pressable, Text, ActivityIndicator, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { colors } from "@/constants/theme";
import { haptics } from "@/lib/haptics";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const VARIANT_STYLES = {
  primary: {
    bg: colors.accent.default,
    text: "#FFFFFF",
    border: "transparent",
    borderWidth: 0,
  },
  secondary: {
    bg: colors.bg.input,
    text: colors.text.primary,
    border: colors.border.default,
    borderWidth: 0.5,
  },
  ghost: {
    bg: "transparent",
    text: colors.accent.default,
    border: "transparent",
    borderWidth: 0,
  },
  danger: {
    bg: colors.danger.bg,
    text: colors.danger.default,
    border: colors.danger.default,
    borderWidth: 0.5,
  },
} as const;

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  fullWidth = true,
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (disabled || loading) return;
    scale.value = withSpring(0.97, { duration: 100 }, () => {
      scale.value = withSpring(1, { duration: 100 });
    });
    haptics.light();
    onPress();
  };

  const style = VARIANT_STYLES[variant];

  return (
    <Animated.View style={[animatedStyle, fullWidth && styles.fullWidth]}>
      <Pressable
        onPress={handlePress}
        disabled={disabled || loading}
        style={[
          styles.button,
          {
            backgroundColor: style.bg,
            borderWidth: style.borderWidth,
            borderColor: style.border,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={style.text} size="small" />
        ) : (
          <Text style={[styles.label, { color: style.text }]}>{label}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  fullWidth: {
    width: "100%",
  },
});
