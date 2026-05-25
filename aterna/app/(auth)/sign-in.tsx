import React, { useState } from "react";
import { View, Text, SafeAreaView, StyleSheet, TextInput, Alert } from "react-native";
import { useOAuth, useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import { Button } from "@/components/ui/Button";
import { colors } from "@/constants/theme";

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  // Local state for Email/Password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const { createdSessionId, setActive: setOAuthActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL("/sso-callback", { scheme: "aterna" }),
      });
      if (createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: createdSessionId });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "OAuth failed";
      console.error("[SignIn] OAuth error:", message);
      Alert.alert("Authentication Failed", "Google sign-in could not be completed.");
    }
  };

  const handleEmailSignIn = async () => {
    if (!isLoaded) return;
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
      } else {
        setError("Sign in incomplete. Additional steps required.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      setError(message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
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

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.text.tertiary}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.text.tertiary}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError(null);
            }}
            secureTextEntry
          />
        </View>

        <Button
          label={loading ? "Signing in..." : "Sign In"}
          onPress={handleEmailSignIn}
          disabled={loading}
        />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Button
          label="Continue with Google"
          onPress={handleGoogleSignIn}
          variant="secondary"
          disabled={loading}
        />

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
    justifyContent: "center",
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.accent.default,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logoEmoji: {
    fontSize: 28,
  },
  logoText: {
    fontSize: 26,
    fontWeight: "300",
    letterSpacing: 4,
    color: colors.text.primary,
  },
  tagline: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 6,
  },
  heading: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 24,
  },
  error: {
    fontSize: 13,
    color: colors.danger.default,
    marginBottom: 12,
    fontWeight: "500",
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    height: 50,
    backgroundColor: colors.bg.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.text.primary,
    marginBottom: 12,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.default,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: colors.text.tertiary,
    fontWeight: "500",
  },
  signUpRow: {
    alignItems: "center",
    marginVertical: 18,
  },
  signUpText: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  signUpLink: {
    color: colors.accent.default,
    fontWeight: "600",
  },
  terms: {
    fontSize: 11,
    color: colors.text.tertiary,
    textAlign: "center",
    marginTop: 8,
  },
});
