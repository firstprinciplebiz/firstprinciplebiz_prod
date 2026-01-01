import type { SupabaseClient } from "@supabase/supabase-js";
import type { Notification } from "../types";

export async function getNotifications(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 20
) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return { data: data as Notification[] | null, error };
}

export async function getUnreadNotificationCount(
  supabase: SupabaseClient,
  userId: string
) {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  return { count: count || 0, error };
}

export async function markNotificationAsRead(
  supabase: SupabaseClient,
  notificationId: string
) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);

  return { error };
}

export async function markAllNotificationsAsRead(
  supabase: SupabaseClient,
  userId: string
) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);

  return { error };
}

export async function createNotification(
  supabase: SupabaseClient,
  notification: {
    user_id: string;
    type: string;
    title: string;
    message: string;
    reference_id?: string;
    reference_type?: string;
  }
) {
  const { data, error } = await supabase
    .from("notifications")
    .insert(notification)
    .select()
    .single();

  return { data: data as Notification | null, error };
}


