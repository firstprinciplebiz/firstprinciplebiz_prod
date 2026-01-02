import type { SupabaseClient } from "@supabase/supabase-js";
import type { Message, Conversation } from "../types";

export async function getConversations(
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase.rpc("get_conversations", {
    user_uuid: userId,
  });

  return { data: data as Conversation[] | null, error };
}

export async function getMessages(
  supabase: SupabaseClient,
  issueId: string,
  userId: string,
  participantId: string
) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("issue_id", issueId)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: true });

  // Filter to only this conversation
  const messages = (data || []).filter(
    (msg: Message) =>
      (msg.sender_id === userId && msg.receiver_id === participantId) ||
      (msg.sender_id === participantId && msg.receiver_id === userId)
  );

  return { data: messages as Message[], error };
}

export async function sendMessage(
  supabase: SupabaseClient,
  message: {
    sender_id: string;
    receiver_id: string;
    issue_id: string;
    content: string;
    attachment_url?: string;
    attachment_name?: string;
    attachment_type?: string;
    attachment_size?: number;
  }
) {
  const { data, error } = await supabase
    .from("messages")
    .insert(message)
    .select()
    .single();

  return { data: data as Message | null, error };
}

export async function markMessagesAsRead(
  supabase: SupabaseClient,
  messageIds: string[]
) {
  const { error } = await supabase
    .from("messages")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .in("id", messageIds);

  return { error };
}

export async function uploadAttachment(
  supabase: SupabaseClient,
  userId: string,
  file: {
    uri: string;
    name: string;
    type: string;
  }
) {
  const fileName = `${userId}/${Date.now()}-${file.name}`;

  // Note: In React Native, you need to convert the file to ArrayBuffer
  // This is a simplified version - actual implementation depends on platform
  const response = await fetch(file.uri);
  const blob = await response.blob();

  const { data, error } = await supabase.storage
    .from("chat-attachments")
    .upload(fileName, blob, {
      contentType: file.type,
    });

  if (error) return { data: null, error };

  return {
    data: {
      path: data.path,
      name: file.name,
      type: file.type,
      size: blob.size,
    },
    error: null,
  };
}

export async function getSignedUrl(
  supabase: SupabaseClient,
  filePath: string,
  expiresIn: number = 3600
) {
  const { data, error } = await supabase.storage
    .from("chat-attachments")
    .createSignedUrl(filePath, expiresIn);

  return { url: data?.signedUrl || null, error };
}



