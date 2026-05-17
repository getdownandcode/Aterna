import React, { useState, useEffect } from "react";
import { View, Text, SafeAreaView, StyleSheet, TextInput } from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { colors } from "@/constants/theme";

export default function VerifyEmail() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !signUp) return;
    if (signUp.status === "complete" && signUp.createdSessionId) {
      setActive({ session: signUp.createdSessionId });
      router.replace("/home");
    }
  }, [isLoaded, signUp, setActive, router]);

  const handleVerify = async () => {
    if (!isLoaded || !signUp) return;
    if (!code) {
      setError("Enter the 6-digit code from your email");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        router.replace("/home");
      } else {
        setError("Verification incomplete. Check the code and try again.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Verification failed";

      if (
        message.toLowerCase().includes("already verified") ||
        message.toLowerCase().includes("identifier")
      ) {
        await signUp.reload();
        if (signUp.status === "complete" && signUp.createdSessionId) {
          await setActive({ session: signUp.createdSessionId });
          router.replace("/home");
          return;
        }
        setError("Already verified. Signing you in...");
        setTimeout(() => router.replace("/home"), 1500);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Check your email</Text>
        <Text style={styles.subheading}>
          Enter the 6-digit verification code we sent to your email.
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <TextInput
          style={styles.input}
          placeholder="Verification code"
          placeholderTextColor={colors.text.tertiary}
          value={code}
          onChangeText={(text) => {
            setCode(text);
            setError(null);
          }}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
        />

        <Button label={loading ? "Verifying..." : "Verify"} onPress={handleVerify} disabled={loading} />

        <View style={styles.backRow}>
          <Text
            style={styles.backLink}
            onPress={() => router.back()}
          >
            Back to sign up
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
    fontSize: 20,
    letterSpacing: 8,
    textAlign: "center",
    color: colors.text.primary,
    marginBottom: 24,
  },
  backRow: {
    alignItems: "center",
    marginTop: 20,
  },
  backLink: {
    fontSize: 14,
    color: colors.accent.default,
  },
});
