import React from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";

interface DividerProps {
  style?: object;
}

export function Divider({ style }: DividerProps) {
  return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
  },
});
