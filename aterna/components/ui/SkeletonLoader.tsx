import React from "react";
import { StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { colors } from "@/constants/theme";

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  style?: object;
}

export function SkeletonLoader({ width = "100%", height = 20, style }: SkeletonLoaderProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[styles.skeleton, { width, height }, style]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.bg.hover,
    borderRadius: 8,
  },
});
