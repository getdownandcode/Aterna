import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function scheduleCheckin(timestamp: number): Promise<string | null> {
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to check in",
        body: "Did you complete your goal for today?",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(timestamp),
      },
    });
    return identifier;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[scheduleCheckin] Failed to schedule notification:", message);
    return null;
  }
}

export async function cancelCheckin(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[cancelCheckin] Failed to cancel notification:", message);
  }
}

export async function sendNudge(title: string, body: string): Promise<string | null> {
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(Date.now() + 60_000),
      },
    });
    return identifier;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[sendNudge] Failed to send nudge:", message);
    return null;
  }
}
