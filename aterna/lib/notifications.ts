import { Platform } from "react-native";
import { supabase } from "./supabase";

let Notifications: any = null;
let isExpoGo = false;

try {
  // Safe load of expo-constants to detect Expo Go
  const Constants = require("expo-constants").default;
  isExpoGo = Constants?.appOwnership === "expo";
} catch (e) {
  // If constants fails, fallback to assumption
}

// In Expo Go Android, importing/using expo-notifications crashes. We force mock it.
const shouldMock = Platform.OS === "android" && isExpoGo;

if (shouldMock) {
  console.log("[Notifications] ⚠️ Running on Android in Expo Go. expo-notifications is mocked to prevent SDK 53/54 crashes.");
} else {
  try {
    Notifications = require("expo-notifications");
  } catch (err) {
    console.warn("[Notifications] ⚠️ Failed to load expo-notifications library:", err);
  }
}

// Configure notification behavior if loaded
if (Notifications && Notifications.setNotificationHandler) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      } as any),
    });
  } catch (err) {
    console.error("[Notifications] Failed to configure setNotificationHandler:", err);
  }
}

/**
 * Retrieves the current notification permission status.
 */
export async function getNotificationPermissionStatus(): Promise<"granted" | "denied" | "undetermined"> {
  if (!Notifications) {
    return "granted"; // Fail-safe fallback for testing/Expo Go environment
  }
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status as "granted" | "denied" | "undetermined";
  } catch (err) {
    console.error("[Notifications] Failed to get permission status:", err);
    return "undetermined";
  }
}

/**
 * Requests permission for push notifications. If granted, retrieves the Expo push token
 * and attempts to save it to the Supabase users table.
 */
export async function requestPermission(clerkUserId?: string): Promise<"granted" | "denied" | "undetermined"> {
  try {
    if (!Notifications) {
      console.log("[Notifications] Mocked permission request: granted");
      // Save mock token to Supabase if clerkUserId is provided
      if (clerkUserId) {
        await supabase
          .from("users")
          .update({ expo_push_token: "mock_expo_push_token_for_expo_go" })
          .eq("clerk_id", clerkUserId);
      }
      return "granted";
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus === "granted") {
      // Set up Android notification channel
      if (Platform.OS === "android" && Notifications.setNotificationChannelAsync) {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance?.MAX || 4,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#7B6EF6",
        });
      }

      // Retrieve Expo push token (wrapped in try/catch to avoid crash on Expo Go SDK 53)
      let token = null;
      try {
        if (Notifications.getExpoPushTokenAsync) {
          const tokenData = await Notifications.getExpoPushTokenAsync();
          token = tokenData.data;
        }
      } catch (tokenErr) {
        console.warn("[Notifications] Failed to retrieve Expo push token (Expo Go SDK 53 limitation):", tokenErr);
        token = "mock_expo_push_token_for_expo_go";
      }

      // Save token to Supabase users table
      if (clerkUserId && token) {
        await supabase
          .from("users")
          .update({ expo_push_token: token })
          .eq("clerk_id", clerkUserId);
      }

      return "granted";
    }

    return finalStatus === "denied" ? "denied" : "undetermined";
  } catch (err) {
    console.error("[Notifications] Failed to request permissions / get token:", err);
    return "undetermined";
  }
}

/**
 * Schedules a local notification at the user's specific check-in time for today.
 * Does not schedule if the time has already passed today.
 */
export async function scheduleCheckinNotification(
  goalId: string,
  checkinTime: string, // format "21:00:00"
  goalText: string
): Promise<string | null> {
  try {
    const [hours, minutes] = checkinTime.split(":").map(Number);
    const now = new Date();
    const triggerDate = new Date();
    triggerDate.setHours(hours, minutes, 0, 0);

    // If the check-in time has already passed today, do not schedule
    if (triggerDate.getTime() <= now.getTime()) {
      console.log("[Notifications] Check-in time has already passed today. Skipping scheduling.");
      return null;
    }

    if (!Notifications) {
      const mockId = `mock_goal_notif_${goalId}`;
      console.log(`[Notifications] Mocked scheduled check-in notification for goal ${goalId} at ${triggerDate.toLocaleTimeString()} (Identifier: ${mockId})`);
      return mockId;
    }

    // Schedule local notification using goalId as identifier for easy cancellation
    const identifier = await Notifications.scheduleNotificationAsync({
      identifier: goalId,
      content: {
        title: "Daily Check-in 🎯",
        body: `It's time to log your progress for: "${goalText}"`,
        data: { screen: "checkin", goalId },
        sound: true,
      },
      trigger: triggerDate as any,
    });

    console.log(`[Notifications] Scheduled check-in notification for goal ${goalId} at ${triggerDate.toLocaleTimeString()} (Identifier: ${identifier})`);
    return identifier;
  } catch (err) {
    console.error("[Notifications] Failed to schedule checkin notification:", err);
    return null;
  }
}

/**
 * Cancels a scheduled local check-in notification.
 */
export async function cancelCheckinNotification(goalId: string): Promise<void> {
  try {
    if (!Notifications) {
      console.log(`[Notifications] Mocked cancelled notification for goal ${goalId}`);
      return;
    }
    await Notifications.cancelScheduledNotificationAsync(goalId);
    console.log(`[Notifications] Cancelled scheduled notification for goal ${goalId}`);
  } catch (err) {
    console.error(`[Notifications] Failed to cancel notification for goal ${goalId}:`, err);
  }
}

/**
 * Schedules a daily repeating morning prompt to remind users to set their goal.
 */
export async function scheduleMorningPrompt(morningTime: string): Promise<string | null> {
  try {
    const [hours, minutes] = morningTime.split(":").map(Number);

    if (!Notifications) {
      console.log(`[Notifications] Mocked scheduled daily morning prompt at ${morningTime}`);
      return "morning-prompt";
    }

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const alreadyScheduled = scheduled.some((n: any) => n.identifier === "morning-prompt");
    if (alreadyScheduled) {
      console.log("[Notifications] Morning prompt already scheduled.");
      return "morning-prompt";
    }

    const calendarTriggerType = Notifications.SchedulableTriggerInputTypes?.CALENDAR || "calendar";

    const identifier = await Notifications.scheduleNotificationAsync({
      identifier: "morning-prompt",
      content: {
        title: "Good morning 🌅",
        body: "Set your goal for today and make it count.",
        data: { screen: "declare" },
        sound: true,
      },
      trigger: {
        type: calendarTriggerType,
        hour: hours,
        minute: minutes,
        repeats: true,
      } as any,
    });

    console.log(`[Notifications] Scheduled daily morning prompt at ${morningTime}`);
    return identifier;
  } catch (err) {
    console.error("[Notifications] Failed to schedule morning prompt:", err);
    return null;
  }
}
