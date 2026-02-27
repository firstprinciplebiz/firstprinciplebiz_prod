import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { scheduleLocalNotification } from "@/lib/notifications";
import { AppState, AppStateStatus } from "react-native";

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  fetchNotifications: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
});

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching notifications:", error);
        return;
      }

      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUnreadCount(0);
        return;
      }

      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) {
        console.error("Error fetching unread count:", error);
        return;
      }

      setUnreadCount(count || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (error) {
        console.error("Error marking notification as read:", error);
        return;
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) {
        console.error("Error marking all as read:", error);
        return;
      }

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const notification = notifications.find((n) => n.id === id);
      
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting notification:", error);
        return;
      }

      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (notification && !notification.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }, [notifications]);

  // Initial fetch - ensure we fetch notifications and set currentUserId on mount
  useEffect(() => {
    const initializeNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        await fetchNotifications();
      }
      await fetchUnreadCount();
    };

    initializeNotifications();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
        await fetchNotifications();
      } else {
        setCurrentUserId(null);
        setNotifications([]);
        setUnreadCount(0);
      }
      await fetchUnreadCount();
    });

    return () => subscription.unsubscribe();
  }, [fetchUnreadCount, fetchNotifications]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUserId}`,
        },
        async (payload) => {
          const newNotification = payload.new as Notification;
          
          // Add to local state
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Check app state - only schedule push notification if app is in background or closed
          const currentAppState = AppState.currentState;
          if (currentAppState !== 'active') {
            // Determine thread identifier based on notification type
            let threadId: string | undefined;
            if (newNotification.type === 'new_message' && newNotification.metadata) {
              const metadata = newNotification.metadata as Record<string, any>;
              // Support both camelCase and snake_case
              const issueId = metadata.issueId || metadata.issue_id;
              const participantId = metadata.participantId || metadata.participant_id;
              if (issueId && participantId) {
                threadId = `chat-${issueId}-${participantId}`;
              }
            } else if (newNotification.type === 'interest_approved' || newNotification.type === 'interest_rejected') {
              const metadata = newNotification.metadata as Record<string, any>;
              // Support both camelCase and snake_case
              const issueId = metadata.issueId || metadata.issue_id;
              if (issueId) {
                threadId = `application-${issueId}`;
              }
            } else if (newNotification.type === 'new_interest') {
              const metadata = newNotification.metadata as Record<string, any>;
              // Support both camelCase and snake_case
              const issueId = metadata.issueId || metadata.issue_id;
              if (issueId) {
                threadId = `interest-${issueId}`;
              }
            }

            try {
              await scheduleLocalNotification(
                newNotification.title,
                newNotification.message,
                {
                  type: newNotification.type,
                  notificationId: newNotification.id,
                  ...newNotification.metadata,
                },
                threadId
              );
            } catch (error) {
              console.error("Error scheduling notification:", error);
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
          );
          // Recalculate unread count
          fetchUnreadCount();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          const deletedNotification = payload.old as Notification;
          setNotifications((prev) => prev.filter((n) => n.id !== deletedNotification.id));
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, fetchUnreadCount]);

  // Track app state for push notifications
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      appState.current = nextAppState;
      // Refresh notifications when app comes to foreground
      if (nextAppState === "active") {
        fetchUnreadCount();
        fetchNotifications(); // Also fetch full notifications list
      }
    });

    return () => {
      subscription.remove();
    };
  }, [fetchUnreadCount, fetchNotifications]);

  // Subscribe to new messages to create message notifications
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel("message-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        async (payload) => {
          const newMessage = payload.new as {
            id: string;
            sender_id: string;
            issue_id: string;
            content: string;
            is_read: boolean;
          };

          // Only notify for unread messages
          if (newMessage.is_read) return;

          // Check app state - only show push notification if app is in background or closed
          const currentAppState = AppState.currentState;
          if (currentAppState !== 'active') {
            // Get sender info
            const { data: senderData } = await supabase
              .from("users")
              .select("role")
              .eq("id", newMessage.sender_id)
              .single();

            let senderName = "Someone";
            
            if (senderData?.role === "student") {
              const { data: studentProfile } = await supabase
                .from("student_profiles")
                .select("full_name")
                .eq("user_id", newMessage.sender_id)
                .single();
              senderName = studentProfile?.full_name || "A student";
            } else if (senderData?.role === "business") {
              const { data: businessProfile } = await supabase
                .from("business_profiles")
                .select("business_name, owner_name")
                .eq("user_id", newMessage.sender_id)
                .single();
              senderName = businessProfile?.business_name || businessProfile?.owner_name || "A business";
            }

            // Use thread identifier to group messages by conversation
            const threadId = `chat-${newMessage.issue_id}-${newMessage.sender_id}`;

            await scheduleLocalNotification(
              `New message from ${senderName}`,
              newMessage.content.substring(0, 100) + (newMessage.content.length > 100 ? "..." : ""),
              {
                type: "new_message",
                issueId: newMessage.issue_id,
                participantId: newMessage.sender_id,
              },
              threadId
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext() {
  return useContext(NotificationsContext);
}




