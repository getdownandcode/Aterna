import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import * as Linking from "expo-linking";
import { clerkTokenCache } from "@/lib/clerk";

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

function RouteGuard() {
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const segments = useSegments();
  const navRouter = useRouter();

  const isLoaded = isAuthLoaded && isUserLoaded;

  // Deep linking handler to support push notification redirects
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      try {
        const parsed = Linking.parse(event.url);
        console.log("[DeepLink] Parsed incoming URL:", parsed);
        
        // Match aterna://checkin?goalId=<uuid>
        if (parsed.path === "checkin" && parsed.queryParams?.goalId) {
          navRouter.push({
            pathname: "/checkin",
            params: { goalId: parsed.queryParams.goalId as string },
          });
        }
      } catch (err) {
        console.error("[DeepLink] Failed to parse URL:", err);
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Check if the app was launched via a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [navRouter]);

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
