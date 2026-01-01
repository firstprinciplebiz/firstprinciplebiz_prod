import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import {
  registerForPushNotificationsAsync,
  savePushToken,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
} from "@/lib/notifications";

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const router = useRouter();

  useEffect(() => {
    // Register for push notifications
    registerForPushNotificationsAsync().then(async (token) => {
      if (token) {
        setExpoPushToken(token);
        await savePushToken(token);
      }
    });

    // Listen for incoming notifications while app is in foreground
    notificationListener.current = addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    // Listen for notification responses (when user taps)
    responseListener.current = addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;

      // Handle navigation based on notification type
      if (data?.type === "new_message" && data?.issueId && data?.participantId) {
        router.push(`/chat/${data.issueId}/${data.participantId}`);
      } else if (data?.type === "interest_approved" && data?.issueId) {
        router.push(`/issues/${data.issueId}`);
      } else if (data?.type === "interest_rejected" && data?.issueId) {
        router.push("/my-applications");
      } else if (data?.type === "new_interest") {
        router.push("/applicants");
      } else if (data?.type === "new_issue" && data?.issueId) {
        router.push(`/issues/${data.issueId}`);
      } else if (data?.notificationId) {
        // Generic notification - go to notifications screen
        router.push("/notifications");
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [router]);

  return {
    expoPushToken,
    notification,
  };
}
