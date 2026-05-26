import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Tab Group containing Home, Discover, Partner, Insights, Profile */}
      <Stack.Screen name="(tabs)" />

      {/* Auxiliary full-screen flow pages */}
      <Stack.Screen name="already-checked-in" />
      <Stack.Screen name="checkin" />
      <Stack.Screen name="checkin-result" />
      <Stack.Screen name="profile/transactions" />

      {/* Goal flows */}
      <Stack.Screen name="goal/declare" />
      <Stack.Screen name="goal/ai-rewrite" />
      <Stack.Screen name="goal/stake" />
      <Stack.Screen name="goal/confirm" />
    </Stack>
  );
}
