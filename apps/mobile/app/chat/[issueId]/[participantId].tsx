import { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { useUnreadMessages } from "@/context/UnreadMessagesContext";
import * as DocumentPicker from "expo-document-picker";
import * as WebBrowser from "expo-web-browser";
import { Send, Paperclip, User, X, FileText } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { dismissNotificationsForThread } from "@/lib/notifications";

// Format file size helper
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
  attachment_size?: number;
}

interface SelectedFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}

interface Participant {
  id: string;
  profileId: string;
  name: string;
  avatar_url: string | null;
  role: string;
}

export default function ChatScreen() {
  const { issueId, participantId } = useLocalSearchParams<{
    issueId: string;
    participantId: string;
  }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const router = useRouter();
  const { refreshUnreadCount } = useUnreadMessages();

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  // Keep ref in sync with state
  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  const handleViewProfile = useCallback(async () => {
    if (participant?.profileId) {
      setIsLoadingProfile(true);
      try {
        const route = participant.role === "student" 
          ? `/profile/student/${participant.profileId}`
          : `/profile/business/${participant.profileId}`;
        await router.push(route);
      } catch (error) {
        console.error("Error navigating to profile:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    }
  }, [participant, router]);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "image/*",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      if (file.size && file.size > MAX_FILE_SIZE) {
        Alert.alert("File too large", "Maximum file size is 5MB");
        return;
      }

      setSelectedFile({
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "application/octet-stream",
        size: file.size || 0,
      });
    } catch (error) {
      console.error("Error picking file:", error);
    }
  };

  const uploadAttachment = async (file: SelectedFile): Promise<string | null> => {
    try {
      const fileName = `${currentUserId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      // Use FormData for file upload in React Native
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);

      // Get the auth token for the upload
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Upload using fetch with FormData
      const uploadResponse = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/chat-attachments/${fileName}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'x-upsert': 'true',
          },
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Upload failed:", errorText);
        throw new Error("Upload failed");
      }

      return fileName;
    } catch (error) {
      console.error("Error uploading attachment:", error);
      return null;
    }
  };

  const getSignedUrl = async (filePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from("chat-attachments")
      .createSignedUrl(filePath, 3600);

    if (error) return null;
    return data.signedUrl;
  };

  // Function to mark messages as read
  const markMessagesAsRead = useCallback(async (messageIds: string[]) => {
    if (messageIds.length === 0) return;
    
    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .in("id", messageIds);
      
      if (error) {
        console.error("Error marking messages as read:", error);
      } else {
        // Refresh the unread count after marking messages as read
        await refreshUnreadCount();
        
        // Clear push notifications for this chat thread
        const threadId = `chat-${issueId}-${participantId}`;
        await dismissNotificationsForThread(threadId);
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [refreshUnreadCount]);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);
      currentUserIdRef.current = user.id;

      // Fetch participant info
      const { data: userData } = await supabase
        .from("users")
        .select("id, role")
        .eq("id", participantId)
        .single();

      if (userData) {
        if (userData.role === "student") {
          const { data } = await supabase
            .from("student_profiles")
            .select("id, full_name, avatar_url")
            .eq("user_id", participantId)
            .single();
          setParticipant({
            id: participantId,
            profileId: data?.id || "",
            name: data?.full_name || "Student",
            avatar_url: data?.avatar_url || null,
            role: "student",
          });
        } else {
          const { data } = await supabase
            .from("business_profiles")
            .select("id, owner_name, avatar_url")
            .eq("user_id", participantId)
            .single();
          setParticipant({
            id: participantId,
            profileId: data?.id || "",
            name: data?.owner_name || "Business",
            avatar_url: data?.avatar_url || null,
            role: "business",
          });
        }
      }

      // Fetch messages
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .eq("issue_id", issueId)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .or(`sender_id.eq.${participantId},receiver_id.eq.${participantId}`)
        .order("created_at", { ascending: true });

      // Filter messages for this conversation
      const conversationMessages = (messagesData || []).filter(
        (msg) =>
          (msg.sender_id === user.id && msg.receiver_id === participantId) ||
          (msg.sender_id === participantId && msg.receiver_id === user.id)
      );

      setMessages(conversationMessages);

      // Mark messages as read
      const unreadIds = conversationMessages
        .filter((msg) => msg.receiver_id === user.id && !msg.is_read)
        .map((msg) => msg.id);

      if (unreadIds.length > 0) {
        await markMessagesAsRead(unreadIds);
        
        // Clear push notifications for this chat thread when opening chat
        const threadId = `chat-${issueId}-${participantId}`;
        await dismissNotificationsForThread(threadId);
      }
    } catch (error) {
      console.error("Error fetching chat data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [issueId, participantId, markMessagesAsRead]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Separate useEffect for realtime subscription
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`chat-${issueId}-${participantId}-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `issue_id=eq.${issueId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          const userId = currentUserIdRef.current;
          
          // Check if this message belongs to this conversation
          const isMyMessage = newMsg.sender_id === userId && newMsg.receiver_id === participantId;
          const isTheirMessage = newMsg.sender_id === participantId && newMsg.receiver_id === userId;
          
          if (isMyMessage || isTheirMessage) {
            // If this message is for me (I'm the receiver), mark it as read immediately
            if (newMsg.receiver_id === userId && !newMsg.is_read) {
              // Mark as read in database
              await markMessagesAsRead([newMsg.id]);
              // Add with is_read = true to local state
              setMessages((prev) => {
                // Prevent duplicate messages
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, { ...newMsg, is_read: true }];
              });
            } else {
              setMessages((prev) => {
                // Prevent duplicate messages
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `issue_id=eq.${issueId}`,
        },
        (payload) => {
          const updatedMsg = payload.new as Message;
          // Update the is_read status in local state
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === updatedMsg.id ? { ...msg, is_read: updatedMsg.is_read } : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [issueId, participantId, currentUserId, markMessagesAsRead]);

  const handleSend = async () => {
    if ((!newMessage.trim() && !selectedFile) || !currentUserId) return;

    setIsSending(true);
    try {
      let attachmentPath: string | null = null;

      // Upload attachment if selected
      if (selectedFile) {
        setIsUploading(true);
        attachmentPath = await uploadAttachment(selectedFile);
        setIsUploading(false);
      }

      const messageData: Record<string, any> = {
        sender_id: currentUserId,
        receiver_id: participantId,
        issue_id: issueId,
        content: newMessage.trim() || (selectedFile ? selectedFile.name : ""),
      };

      if (attachmentPath && selectedFile) {
        messageData.attachment_url = attachmentPath;
        messageData.attachment_name = selectedFile.name;
        messageData.attachment_type = selectedFile.type;
        messageData.attachment_size = selectedFile.size;
      }

      const { error } = await supabase.from("messages").insert(messageData);

      if (error) throw error;
      setNewMessage("");
      setSelectedFile(null);
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message");
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const AttachmentDisplay = ({ message, isMine }: { message: Message; isMine: boolean }) => {
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const isImage = message.attachment_type?.startsWith("image/");

    useEffect(() => {
      if (isImage && message.attachment_url) {
        setLoading(true);
        getSignedUrl(message.attachment_url)
          .then(setSignedUrl)
          .finally(() => setLoading(false));
      }
    }, [message.attachment_url, isImage]);

    const handleDownload = async () => {
      if (!message.attachment_url) return;
      setLoading(true);
      try {
        const url = await getSignedUrl(message.attachment_url);
        setLoading(false);
        if (url) {
          // Check if it's a PDF or document
          const isPDF = message.attachment_type === "application/pdf" || 
                       message.attachment_name?.toLowerCase().endsWith(".pdf") ||
                       message.attachment_type?.includes("document") ||
                       message.attachment_type?.includes("word");
          
          if (isPDF) {
            // Open in in-app browser
            await WebBrowser.openBrowserAsync(url, {
              presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
            });
          } else {
            // For other files, show alert (can be enhanced later)
            Alert.alert("File", `File URL: ${url.substring(0, 50)}...`);
          }
        }
      } catch (error) {
        setLoading(false);
        Alert.alert("Error", "Failed to open file");
      }
    };

    if (isImage) {
      if (loading) {
        return (
          <View className="w-48 h-32 bg-slate-200 rounded-lg items-center justify-center">
            <ActivityIndicator color={isMine ? "white" : "#2563EB"} />
          </View>
        );
      }
      if (signedUrl) {
        return (
          <TouchableOpacity
            onPress={() => setZoomedImage(signedUrl)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: signedUrl }}
              className="w-48 h-32 rounded-lg"
              resizeMode="cover"
            />
          </TouchableOpacity>
        );
      }
    }

    return (
      <TouchableOpacity
        onPress={handleDownload}
        disabled={loading}
        className={`flex-row items-center p-2 rounded-lg border ${
          isMine ? "border-white/30" : "border-slate-200"
        }`}
      >
        {loading ? (
          <ActivityIndicator color={isMine ? "white" : "#64748B"} />
        ) : (
          <FileText color={isMine ? "white" : "#64748B"} size={24} />
        )}
        <View className="flex-1 ml-2">
          <Text
            className={`text-sm font-medium ${isMine ? "text-white" : "text-slate-900"}`}
            numberOfLines={1}
          >
            {message.attachment_name}
          </Text>
          <Text className={`text-xs ${isMine ? "text-white/70" : "text-slate-500"}`}>
            {message.attachment_size ? formatFileSize(message.attachment_size) : ""}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.sender_id === currentUserId;

    return (
      <View
        className={`flex-row mb-2 ${isMine ? "justify-end" : "justify-start"}`}
      >
        <View
          className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
            isMine
              ? "bg-primary rounded-br-sm"
              : "bg-white border border-slate-200 rounded-bl-sm"
          }`}
        >
          {item.attachment_url && (
            <View className="mb-2">
              <AttachmentDisplay message={item} isMine={isMine} />
            </View>
          )}
          {item.content && !item.attachment_url && (
            <Text className={isMine ? "text-white" : "text-slate-900"}>
              {item.content}
            </Text>
          )}
          {item.content && item.attachment_url && item.content !== item.attachment_name && (
            <Text className={`mt-1 ${isMine ? "text-white" : "text-slate-900"}`}>
              {item.content}
            </Text>
          )}
          <View className="flex-row items-center justify-end mt-1">
            <Text
              className={`text-xs ${
                isMine ? "text-white/70" : "text-slate-400"
              }`}
            >
              {formatTime(item.created_at)}
            </Text>
            {isMine && (
              <Text className={`text-xs ml-1 ${item.is_read ? "text-blue-200" : "text-white/70"}`}>
                {item.is_read ? "✓✓" : "✓"}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Header component for profile navigation
  const HeaderTitle = () => (
    <TouchableOpacity
      onPress={handleViewProfile}
      disabled={isLoadingProfile}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
        opacity: isLoadingProfile ? 0.7 : 1,
      }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      {isLoadingProfile ? (
        <ActivityIndicator size="small" color="#2563EB" style={{ marginRight: 8 }} />
      ) : participant?.avatar_url ? (
        <Image
          source={{ uri: participant.avatar_url }}
          style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }}
        />
      ) : (
        <View style={{ 
          width: 32, 
          height: 32, 
          borderRadius: 16, 
          backgroundColor: '#F1F5F9',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 8 
        }}>
          <User color="#94A3B8" size={16} />
        </View>
      )}
      <Text style={{ fontSize: 16, fontWeight: '600', color: '#0F172A' }}>
        {participant?.name || "Chat"}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => <HeaderTitle />,
          headerTitleAlign: 'left',
          headerTitleStyle: {
            width: '100%',
          },
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-slate-50"
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-slate-500">No messages yet</Text>
              <Text className="text-slate-400 text-sm mt-1">
                Start the conversation!
              </Text>
            </View>
          }
        />

        {/* Selected File Preview */}
        {selectedFile && (
          <View className="px-4 py-2 bg-slate-50 border-t border-slate-200">
            <View className="flex-row items-center bg-white p-2 rounded-lg border border-slate-200">
              <FileText color="#64748B" size={20} />
              <View className="flex-1 ml-2">
                <Text className="text-sm font-medium text-slate-900" numberOfLines={1}>
                  {selectedFile.name}
                </Text>
                <Text className="text-xs text-slate-500">
                  {formatFileSize(selectedFile.size)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedFile(null)}>
                <X color="#64748B" size={20} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Input */}
        <View className="p-4 bg-white border-t border-slate-200">
          <View className="flex-row items-center">
            <TouchableOpacity
              className="w-10 h-10 items-center justify-center"
              onPress={handlePickFile}
            >
              <Paperclip color="#64748B" size={22} />
            </TouchableOpacity>
            <View className="flex-1 flex-row items-center bg-slate-100 rounded-full px-4 py-2 mx-2">
              <TextInput
                className="flex-1 text-base text-slate-900"
                placeholder="Type a message..."
                placeholderTextColor="#94A3B8"
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={1000}
              />
            </View>
            <TouchableOpacity
              className={`w-12 h-12 rounded-full items-center justify-center ${
                (newMessage.trim() || selectedFile) ? "bg-primary" : "bg-slate-200"
              }`}
              onPress={handleSend}
              disabled={(!newMessage.trim() && !selectedFile) || isSending}
            >
              {isSending || isUploading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Send
                  color={(newMessage.trim() || selectedFile) ? "white" : "#94A3B8"}
                  size={20}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <Modal
          visible={!!zoomedImage}
          transparent
          animationType="fade"
          onRequestClose={() => setZoomedImage(null)}
        >
          <View className="flex-1 bg-black/90 items-center justify-center">
            <TouchableOpacity
              className="absolute top-12 right-4 z-10"
              onPress={() => setZoomedImage(null)}
            >
              <X color="white" size={24} />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 w-full items-center justify-center"
              activeOpacity={1}
              onPress={() => setZoomedImage(null)}
            >
              <Image
                source={{ uri: zoomedImage }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </>
  );
}
