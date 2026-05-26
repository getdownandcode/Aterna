import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-expo";
import { requestPermission, scheduleMorningPrompt, getNotificationPermissionStatus } from "@/lib/notifications";

/**
 * Custom hook to handle notification permissions and initial morning prompt setup.
 */
export function useNotifications() {
  const { user, isLoaded } = useUser();
  const [status, setStatus] = useState<"granted" | "denied" | "undetermined">("undetermined");

  const askForPermission = async () => {
    if (!isLoaded || !user) return;
    const finalStatus = await requestPermission(user.id);
    setStatus(finalStatus);

    if (finalStatus === "granted") {
      const morningTime = (user.unsafeMetadata.morning_time as string) || "08:00:00";
      await scheduleMorningPrompt(morningTime);
    }
  };

  useEffect(() => {
    const checkCurrentPermissionStatus = async () => {
      try {
        const currentStatus = await getNotificationPermissionStatus();
        setStatus(currentStatus);

        // If permission is already granted, verify morning prompt is scheduled
        if (currentStatus === "granted" && user) {
          const morningTime = (user.unsafeMetadata.morning_time as string) || "08:00:00";
          await scheduleMorningPrompt(morningTime);
        }
      } catch (err) {
        console.error("[useNotifications] Failed to check permission status:", err);
      }
    };

    if (isLoaded && user) {
      checkCurrentPermissionStatus();
    }
  }, [user, isLoaded]);

  return {
    status,
    requestPermission: askForPermission,
  };
}
