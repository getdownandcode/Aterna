import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { clerkTokenCache } from "@/lib/clerk";

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

function RouteGuard() {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const navRouter = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isSignedIn && !inAuthGroup) {
      navRouter.replace("/sign-in");
    } else if (isSignedIn && inAuthGroup) {
      navRouter.replace("/home");
    }
  }, [isSignedIn, isLoaded, segments, navRouter]);

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
