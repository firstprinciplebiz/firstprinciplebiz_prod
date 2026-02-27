import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { supabase } from "./supabase";

// Check if running in Expo Go (push notifications not supported in Expo Go SDK 53+)
const isExpoGo = Constants.executionEnvironment === "storeClient";

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and return the token
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  // Skip push notifications in Expo Go (not supported in SDK 53+)
  if (isExpoGo) {
    console.log("Push notifications are not supported in Expo Go. Use a development build for push notifications.");
    return undefined;
  }

  let token: string | undefined;

  if (Platform.OS === "android") {
    // Set up notification channel for Android
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2563EB",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return;
    }

    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      // Only attempt to get push token if projectId is configured
      if (projectId) {
        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;
        console.log("Push token:", token);
      } else {
        console.log("Push notifications not configured (missing EAS projectId)");
      }
    } catch (e) {
      // Silently handle push notification errors in development
      console.log("Push notifications not available:", (e as Error).message);
    }
  } else {
    console.log("Must use physical device for Push Notifications");
  }

  return token;
}

/**
 * Save the push token to the database for the current user
 */
export async function savePushToken(token: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Store token in user's profile or a dedicated tokens table
    const { error } = await supabase
      .from("users")
      .update({ push_token: token })
      .eq("id", user.id);

    if (error) {
      console.error("Error saving push token:", error);
    }
  } catch (error) {
    console.error("Error saving push token:", error);
  }
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  threadIdentifier?: string
): Promise<string> {
  const notificationContent: Notifications.NotificationContentInput = {
    title,
    body,
    data,
    sound: true,
  };

  // Add thread identifier for grouping (WhatsApp-like behavior)
  if (threadIdentifier) {
    if (Platform.OS === 'android') {
      notificationContent.android = {
        threadId: threadIdentifier,
        channelId: 'default',
      };
    } else {
      notificationContent.threadIdentifier = threadIdentifier;
    }
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: notificationContent,
    trigger: null, // Immediately
  });

  return identifier;
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Dismiss notifications for a specific thread (conversation)
 */
export async function dismissNotificationsForThread(threadIdentifier: string): Promise<void> {
  try {
    // Get all delivered notifications
    const notifications = await Notifications.getDeliveredNotificationsAsync();
    
    // Filter and dismiss notifications for this thread
    for (const notification of notifications) {
      const data = notification.request.content.data;
      // Check if this notification belongs to the thread
      if (Platform.OS === 'android' && notification.request.content.android?.threadId === threadIdentifier) {
        await Notifications.dismissNotificationAsync(notification.request.identifier);
      } else if (Platform.OS === 'ios' && notification.request.content.threadIdentifier === threadIdentifier) {
        await Notifications.dismissNotificationAsync(notification.request.identifier);
      } else if (data) {
        // Fallback: check data for thread info
        if (data.issueId && data.participantId) {
          const threadId = `chat-${data.issueId}-${data.participantId}`;
          if (threadId === threadIdentifier) {
            await Notifications.dismissNotificationAsync(notification.request.identifier);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error dismissing notifications for thread:", error);
  }
}

/**
 * Get the notification badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set the notification badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Add a notification listener
 */
export function addNotificationReceivedListener(
  listener: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(listener);
}

/**
 * Add a notification response listener (when user taps notification)
 */
export function addNotificationResponseReceivedListener(
  listener: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(listener);
}

