"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type NotificationType =
  | "new_interest"
  | "interest_approved"
  | "interest_rejected"
  | "new_message"
  | "new_issue";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  metadata = {},
}: CreateNotificationParams) {
  const supabase = await createClient();

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message,
    metadata,
    is_read: false,
  });

  if (error) {
    console.error("Error creating notification:", error);
    return { error: "Failed to create notification" };
  }

  return { success: true };
}

export async function getNotifications(limit = 20) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "You must be logged in", notifications: [] };
  }

  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching notifications:", error);
    return { error: "Failed to fetch notifications", notifications: [] };
  }

  return { notifications: notifications || [] };
}

export async function getUnreadCount() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { count: 0 };
  }

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("Error fetching unread count:", error);
    return { count: 0 };
  }

  return { count: count || 0 };
}

export async function markAsRead(notificationId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "You must be logged in" };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error marking notification as read:", error);
    return { error: "Failed to mark as read" };
  }

  revalidatePath("/");
  return { success: true };
}

export async function markAllAsRead() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "You must be logged in" };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("Error marking all as read:", error);
    return { error: "Failed to mark all as read" };
  }

  revalidatePath("/");
  return { success: true };
}

export async function deleteNotification(notificationId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "You must be logged in" };
  }

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting notification:", error);
    return { error: "Failed to delete notification" };
  }

  revalidatePath("/");
  return { success: true };
}




