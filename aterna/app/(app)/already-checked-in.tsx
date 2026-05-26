import React from "react";
import { View, Text, SafeAreaView, StyleSheet, ScrollView, Platform, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Moon } from "lucide-react-native";
import { colors } from "@/constants/theme";
import { Button } from "@/components/ui/Button";

export default function AlreadyCheckedIn() {
  const router = useRouter();

  const handleGoHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/home");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Moon color={colors.accent.default} size={48} fill={colors.accent.default + "20"} />
          </View>
          
          <Text style={styles.title}>You're all done for today</Text>
          <Text style={styles.subtitle}>
            You have already resolved your goal or no active contract exists for today. Come back tomorrow to set your next goal!
          </Text>

          <View style={styles.buttonContainer}>
            <Button
              label="Go to Home"
              onPress={handleGoHome}
              variant="primary"
              fullWidth={true}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
    paddingTop: Platform.OS === "ios" ? 12 : (StatusBar.currentHeight || 0) + 12,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.accent.default + "10",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    borderWidth: 1,
    borderColor: colors.accent.default + "20",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.secondary,
    textAlign: "center",
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  buttonContainer: {
    width: "100%",
    paddingHorizontal: 24,
  },
});
