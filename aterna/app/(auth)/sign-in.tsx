import React from "react";
import { View, Text, SafeAreaView, StyleSheet } from "react-native";
import { useOAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { colors } from "@/constants/theme";

export default function SignIn() {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/home");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "OAuth failed";
      console.error("[SignIn] OAuth error:", message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoSection}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>🔥</Text>
          </View>
          <Text style={styles.logoText}>aterna</Text>
          <Text style={styles.tagline}>Your word. Your stake. Your future.</Text>
        </View>

        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.subheading}>Sign in to continue your streak.</Text>

        <Button label="Continue with Google" onPress={handleGoogleSignIn} variant="secondary" />

        <View style={styles.signUpRow}>
          <Text style={styles.signUpText}>
            Don&apos;t have an account?{" "}
            <Text
              style={styles.signUpLink}
              onPress={() => router.push("/sign-up")}
            >
              Sign up
            </Text>
          </Text>
        </View>

        <Text style={styles.terms}>
          By continuing, you agree to Aterna&apos;s Terms and Privacy Policy.
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
    justifyContent: "flex-end",
    paddingBottom: 48,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 64,
  },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.accent.default,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoEmoji: {
    fontSize: 32,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "300",
    letterSpacing: 4,
    color: colors.text.primary,
  },
  tagline: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: 8,
  },
  heading: {
    fontSize: 26,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 15,
    color: colors.text.secondary,
    marginBottom: 40,
  },
  signUpRow: {
    alignItems: "center",
    marginVertical: 20,
  },
  signUpText: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  signUpLink: {
    color: colors.accent.default,
  },
  terms: {
    fontSize: 11,
    color: colors.border.emphasis,
    textAlign: "center",
  },
});
