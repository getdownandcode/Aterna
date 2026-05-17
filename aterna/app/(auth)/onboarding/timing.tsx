import React from "react";
import { View, Text, SafeAreaView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { colors } from "@/constants/theme";

const MORNING_TIME = "08:00";
const CHECKIN_TIME = "21:00";

export default function Timing() {
  const router = useRouter();

  const handleFinish = () => {
    router.replace("/home");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.step}>Step 3 of 3</Text>
        <Text style={styles.heading}>Set your schedule</Text>
        <Text style={styles.subheading}>
          When should we remind you to declare your goal and check in?
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Morning goal prompt</Text>
          <Text style={styles.time}>{MORNING_TIME}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Evening check-in</Text>
          <Text style={styles.time}>{CHECKIN_TIME}</Text>
        </View>

        <Button label="Get started" onPress={handleFinish} />
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
    marginBottom: 40,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text.secondary,
    marginBottom: 8,
  },
  time: {
    fontSize: 32,
    fontWeight: "600",
    color: colors.text.primary,
  },
});
