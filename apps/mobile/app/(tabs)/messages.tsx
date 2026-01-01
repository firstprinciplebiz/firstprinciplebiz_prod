import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { MessageCircle, User } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { useUnreadMessages } from "@/context/UnreadMessagesContext";

interface Conversation {
  issue_id: string;
  issue_title: string;
  participant_id: string;
  participant_name: string;
  participant_avatar: string | null;
  participant_role: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { refreshUnreadCount } = useUnreadMessages();

  const fetchConversations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc("get_conversations", {
        user_uuid: user.id,
      });

      if (error) throw error;
      setConversations(data || []);
      
      // Refresh unread count after fetching conversations
      await refreshUnreadCount();
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [refreshUnreadCount]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, [fetchConversations]);

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

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={{ paddingTop: 16 }}
    >
      <View className="px-4 pb-4">
        {conversations.length === 0 ? (
          <Card className="p-8 items-center">
            <View className="w-16 h-16 bg-slate-100 rounded-full items-center justify-center mb-4">
              <MessageCircle color="#94A3B8" size={32} />
            </View>
            <Text className="text-lg font-semibold text-slate-900 mb-2">
              No messages yet
            </Text>
            <Text className="text-slate-600 text-center">
              When you start chatting with businesses or students, your
              conversations will appear here.
            </Text>
          </Card>
        ) : (
          <View className="space-y-2">
            {conversations.map((conv) => (
              <TouchableOpacity
                key={`${conv.issue_id}-${conv.participant_id}`}
                onPress={() =>
                  router.push(`/chat/${conv.issue_id}/${conv.participant_id}`)
                }
              >
                <Card className="p-4">
                  <View className="flex-row items-center">
                    {/* Avatar */}
                    <View className="w-12 h-12 rounded-full bg-slate-100 items-center justify-center overflow-hidden">
                      {conv.participant_avatar ? (
                        <Image
                          source={{ uri: conv.participant_avatar }}
                          className="w-full h-full"
                        />
                      ) : (
                        <User color="#94A3B8" size={24} />
                      )}
                    </View>

                    {/* Content */}
                    <View className="flex-1 ml-3">
                      <View className="flex-row items-center justify-between">
                        <Text className="font-semibold text-slate-900">
                          {conv.participant_name}
                        </Text>
                        <Text className="text-xs text-slate-400">
                          {formatTime(conv.last_message_time)}
                        </Text>
                      </View>
                      <Text className="text-xs text-slate-500 mt-0.5">
                        {conv.issue_title}
                      </Text>
                      <View className="flex-row items-center justify-between mt-1">
                        <Text
                          className="text-sm text-slate-600 flex-1"
                          numberOfLines={1}
                        >
                          {conv.last_message}
                        </Text>
                        {conv.unread_count > 0 && (
                          <View className="bg-primary w-5 h-5 rounded-full items-center justify-center ml-2">
                            <Text className="text-xs text-white font-medium">
                              {conv.unread_count}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

