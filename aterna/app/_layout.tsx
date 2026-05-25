import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { clerkTokenCache } from "@/lib/clerk";

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

function RouteGuard() {
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const segments = useSegments();
  const navRouter = useRouter();

  const isLoaded = isAuthLoaded && isUserLoaded;

  useEffect(() => {
    const segs = segments as string[];
    console.log("[RouteGuard] AuthState:", {
      isLoaded,
      isSignedIn,
      segments: segs,
      onboardingComplete: user?.unsafeMetadata?.onboardingComplete,
      inOnboarding: segs.includes("onboarding")
    });

    if (!isLoaded) return;

    const inAuthGroup =
      segs.includes("(auth)") ||
      segs.includes("sign-in") ||
      segs.includes("sign-up") ||
      segs.includes("verify-email");
    const isCallbackPage = segs.includes("sso-callback");

    if (!isSignedIn && !inAuthGroup && !isCallbackPage) {
      navRouter.replace("/sign-in");
    } else if (isSignedIn) {
      const onboardingComplete = user?.unsafeMetadata?.onboardingComplete === true;
      const inOnboarding = segs.includes("onboarding");

      if (!onboardingComplete) {
        if (!inOnboarding) {
          navRouter.replace("/onboarding/categories");
        }
      } else {
        if (inAuthGroup || isCallbackPage) {
          navRouter.replace("/home");
        }
      }
    }
  }, [isSignedIn, isLoaded, segments, user, navRouter]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      tokenCache={clerkTokenCache}
      routerPush={(href: string) => require("expo-router").router.push(href as never)}
      routerReplace={(href: string) => require("expo-router").router.replace(href as never)}
    >
      <RouteGuard />
    </ClerkProvider>
  );
}
