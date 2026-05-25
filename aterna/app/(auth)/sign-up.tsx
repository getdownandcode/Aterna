import React, { useState } from "react";
import { View, Text, SafeAreaView, StyleSheet, TextInput } from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { colors } from "@/constants/theme";

export default function SignUp() {
  const { isLoaded, signUp } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignUp = async () => {
    if (!isLoaded) return;
    if (!email || !password || !displayName) {
      setError("All fields are required");
      return;
    }

    try {
      const nameParts = displayName.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || ".";

      await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      router.push("/verify-email");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign up failed";
      setError(message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Create account</Text>
        <Text style={styles.subheading}>Start your accountability journey.</Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <TextInput
          style={styles.input}
          placeholder="Display name"
          placeholderTextColor={colors.text.tertiary}
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.text.tertiary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.text.tertiary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Button label="Create account" onPress={handleSignUp} />

        <View style={styles.signInRow}>
          <Text style={styles.signInText}>
            Already have an account?{" "}
            <Text
              style={styles.signInLink}
              onPress={() => router.push("/sign-in")}
            >
              Sign in
            </Text>
          </Text>
        </View>
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
  heading: {
    fontSize: 26,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 15,
    color: colors.text.secondary,
    marginBottom: 32,
  },
  error: {
    fontSize: 14,
    color: colors.danger.default,
    marginBottom: 16,
  },
  input: {
    height: 52,
    backgroundColor: colors.bg.input,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.border.default,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 16,
  },
  signInRow: {
    alignItems: "center",
    marginTop: 20,
  },
  signInText: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  signInLink: {
    color: colors.accent.default,
  },
});
