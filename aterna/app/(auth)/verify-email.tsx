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
    }
  }, [isLoaded, signUp, setActive]);

  const handleVerify = async () => {
    if (!isLoaded || !signUp) return;
    const cleanCode = code.trim();
    if (!cleanCode) {
      setError("Enter the 6-digit code from your email");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("[VerifyEmail] Attempting email verification with code:", cleanCode);
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: cleanCode,
      });

      console.log("[VerifyEmail] attemptEmailAddressVerification response status:", completeSignUp.status);

      if (completeSignUp.status === "complete") {
        if (completeSignUp.createdSessionId) {
          await setActive({ session: completeSignUp.createdSessionId });
        } else {
          setError("Verification complete, but no session was created.");
        }
      } else if (completeSignUp.createdSessionId) {
        // Failsafe: if we have a session ID, try to activate it anyway
        console.log("[VerifyEmail] Incomplete status but session ID is present. Attempting to activate session...");
        await setActive({ session: completeSignUp.createdSessionId });
      } else {
        console.warn("[VerifyEmail] Incomplete sign-up response:", JSON.stringify(completeSignUp, null, 2));
        
        // Extract outstanding requirements if possible
        const missing = (completeSignUp as any).missingFields || (completeSignUp as any).unverifiedFields || [];
        if (missing.length > 0) {
          setError(`Verification successful, but sign-up is incomplete. Missing required fields: ${missing.join(", ")}`);
        } else {
          setError(`Verification successful, but sign-up status is "${completeSignUp.status}". Please verify your Clerk project settings.`);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Verification failed";
      console.error("[VerifyEmail] Verification error:", err);

      if (
        message.toLowerCase().includes("already verified") ||
        message.toLowerCase().includes("identifier")
      ) {
        await signUp.reload();
        if (signUp.status === "complete" && signUp.createdSessionId) {
          await setActive({ session: signUp.createdSessionId });
          return;
        }
        setError("Already verified. Signing you in...");
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
