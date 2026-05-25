import React, { useEffect, useRef } from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { useSignIn, useSignUp, useAuth } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { colors } from "@/constants/theme";

export default function SSOCallback() {
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Create refs to always check the latest auth values inside the callback / timeout closure
  const isSignedInRef = useRef(isSignedIn);
  const signInStatusRef = useRef(signIn?.status);

  useEffect(() => {
    isSignedInRef.current = isSignedIn;
  }, [isSignedIn]);

  useEffect(() => {
    signInStatusRef.current = signIn?.status;
  }, [signIn?.status]);

  useEffect(() => {
    if (isSignedIn) {
      console.log("[SSOCallback] Already signed in, delegating to RouteGuard.");
      return;
    }

    if (!isSignInLoaded || !isSignUpLoaded || !setActive) return;

    let timeoutId: any = null;

    const handleCallback = async () => {
      try {
        const nonce = params.rotating_token_nonce;
        if (typeof nonce === "string" && nonce) {
          console.log("[SSOCallback] Processing rotating token nonce:", nonce);
          await signIn.reload({ rotatingTokenNonce: nonce });

          if (signIn.status === "complete") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await setActive({ session: signIn.createdSessionId });
          } else if (signIn.firstFactorVerification?.status === "transferable") {
            console.log("[SSOCallback] Session is transferable, transferring to sign-up...");
            const completeSignUp = await signUp.create({ transfer: true });
            if (completeSignUp.status === "complete" && completeSignUp.createdSessionId) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await setActive({ session: completeSignUp.createdSessionId });
            } else {
              console.warn("[SSOCallback] SignUp transfer incomplete. Status:", completeSignUp.status);
              router.replace("/sign-in");
            }
          } else {
            console.warn("[SSOCallback] SignIn reload status not complete or transferable. Status:", signIn.status);
            router.replace("/sign-in");
          }
        } else {
          // Fallback if accessed without nonce (e.g. standard browser redirect loops)
          // Wait up to 8 seconds to allow Clerk's auth state or active session to update.
          console.log("[SSOCallback] Mounted without nonce, waiting for dynamic auth sync...");
          timeoutId = setTimeout(() => {
            if (isSignedInRef.current || signInStatusRef.current === "complete") {
              console.log("[SSOCallback] Dynamic auth sync verified. Leaving navigation to RouteGuard.");
            } else {
              console.log("[SSOCallback] Dynamic auth sync timed out after 8s, replacing to /sign-in");
              router.replace("/sign-in");
            }
          }, 8000);
        }
      } catch (err) {
        console.error("[SSOCallback] Fail-safe redirect error:", err);
        if (isSignedInRef.current) {
          console.log("[SSOCallback] Signed in despite error, delegating to RouteGuard.");
        } else {
          router.replace("/sign-in");
        }
      }
    };

    handleCallback();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isSignInLoaded, isSignUpLoaded, params, setActive, isSignedIn]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accent.default} />
      <Text style={styles.text}>Completing secure sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: "500",
    marginTop: 16,
  },
});
