import { useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Bell,
  Briefcase,
  UserCheck,
  UserX,
  MessageSquare,
  CheckCheck,
  Trash2,
  ChevronRight,
} from "lucide-react-native";
import { useNotificationsContext } from "@/context/NotificationsContext";

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationsContext();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_interest":
        return <Briefcase color="#3B82F6" size={20} />;
      case "interest_approved":
        return <UserCheck color="#22C55E" size={20} />;
      case "interest_rejected":
        return <UserX color="#F97316" size={20} />;
      case "new_message":
        return <MessageSquare color="#8B5CF6" size={20} />;
      case "new_issue":
        return <Briefcase color="#06B6D4" size={20} />;
      default:
        return <Bell color="#64748B" size={20} />;
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationPress = async (notification: (typeof notifications)[0]) => {
    // Mark as read first
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    const metadata = notification.metadata as Record<string, string>;
    
    switch (notification.type) {
      case "new_interest":
        // Business: Go to applicants
        if (metadata?.issueId) {
          router.push("/applicants");
        }
        break;
      case "interest_approved":
      case "interest_rejected":
        // Student: Go to issue detail or my applications
        if (metadata?.issueId) {
          router.push(`/issues/${metadata.issueId}`);
        }
        break;
      case "new_message":
        // Go to chat
        if (metadata?.issueId && metadata?.participantId) {
          router.push(`/chat/${metadata.issueId}/${metadata.participantId}`);
        }
        break;
      case "new_issue":
        // Go to issue
        if (metadata?.issueId) {
          router.push(`/issues/${metadata.issueId}`);
        }
        break;
    }
  };

  const onRefresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  if (isLoading && notifications.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header Actions */}
      {unreadCount > 0 && (
        <View className="flex-row justify-end px-4 py-2 bg-white border-b border-slate-200">
          <TouchableOpacity
            className="flex-row items-center px-3 py-2 rounded-lg bg-primary/10"
            onPress={markAllAsRead}
          >
            <CheckCheck color="#2563EB" size={16} />
            <Text className="ml-2 text-sm font-medium text-primary">
              Mark all as read
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingVertical: 8 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
      >
        {notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <View className="w-16 h-16 rounded-full bg-slate-200 items-center justify-center mb-4">
              <Bell color="#94A3B8" size={32} />
            </View>
            <Text className="text-lg font-semibold text-slate-700 mb-1">
              No notifications yet
            </Text>
            <Text className="text-sm text-slate-500 text-center px-8">
              You'll see notifications here when there's activity on your account
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              className={`mx-4 mb-2 p-4 rounded-xl border ${
                notification.is_read
                  ? "bg-white border-slate-200"
                  : "bg-blue-50 border-blue-200"
              }`}
              onPress={() => handleNotificationPress(notification)}
              activeOpacity={0.7}
            >
              <View className="flex-row">
                {/* Icon */}
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                    notification.is_read ? "bg-slate-100" : "bg-white"
                  }`}
                >
                  {getNotificationIcon(notification.type)}
                </View>

                {/* Content */}
                <View className="flex-1">
                  <View className="flex-row items-start justify-between">
                    <Text
                      className={`text-base font-semibold flex-1 pr-2 ${
                        notification.is_read ? "text-slate-700" : "text-slate-900"
                      }`}
                    >
                      {notification.title}
                    </Text>
                    {!notification.is_read && (
                      <View className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5" />
                    )}
                  </View>
                  <Text
                    className={`text-sm mt-1 ${
                      notification.is_read ? "text-slate-500" : "text-slate-600"
                    }`}
                    numberOfLines={2}
                  >
                    {notification.message}
                  </Text>
                  <View className="flex-row items-center justify-between mt-2">
                    <Text className="text-xs text-slate-400">
                      {formatTime(notification.created_at)}
                    </Text>
                    <View className="flex-row items-center">
                      <TouchableOpacity
                        className="p-2 -mr-2"
                        onPress={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Trash2 color="#94A3B8" size={16} />
                      </TouchableOpacity>
                      <ChevronRight color="#94A3B8" size={16} />
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        {notifications.length > 0 && (
          <Text className="text-xs text-center text-slate-400 py-4">
            Showing last {notifications.length} notifications
          </Text>
        )}
      </ScrollView>
    </View>
  );
}


