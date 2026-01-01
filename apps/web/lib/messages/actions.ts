"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Check if a user can message another user for a specific issue
export async function canMessage(issueId: string, otherUserId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Get user role
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData) return false;

  // Get the issue and check if there's an approved interest
  const { data: issue } = await supabase
    .from("issues")
    .select("id, business_id")
    .eq("id", issueId)
    .single();

  if (!issue) return false;

  // Get the business owner's user_id
  const { data: businessProfile } = await supabase
    .from("business_profiles")
    .select("user_id")
    .eq("id", issue.business_id)
    .single();

  if (!businessProfile) return false;

  const businessUserId = businessProfile.user_id;

  // If current user is the business owner
  if (user.id === businessUserId) {
    // Check if the other user (student) has an approved interest
    const { data: studentProfile } = await supabase
      .from("student_profiles")
      .select("id")
      .eq("user_id", otherUserId)
      .single();

    if (!studentProfile) return false;

    const { data: interest } = await supabase
      .from("issue_interests")
      .select("id, status")
      .eq("issue_id", issueId)
      .eq("student_id", studentProfile.id)
      .eq("status", "approved")
      .single();

    return !!interest;
  }

  // If current user is a student
  if (userData.role === "student") {
    // Check if they have an approved interest for this issue
    const { data: studentProfile } = await supabase
      .from("student_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!studentProfile) return false;

    const { data: interest } = await supabase
      .from("issue_interests")
      .select("id, status")
      .eq("issue_id", issueId)
      .eq("student_id", studentProfile.id)
      .eq("status", "approved")
      .single();

    return !!interest && otherUserId === businessUserId;
  }

  return false;
}

// Send a message with optional attachment
export async function sendMessage({
  receiverId,
  issueId,
  content,
  attachment,
}: {
  receiverId: string;
  issueId: string;
  content: string;
  attachment?: {
    url: string;
    name: string;
    type: string;
    size: number;
  };
}) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "You must be logged in to send messages" };
  }

  // Verify the user can message
  const allowed = await canMessage(issueId, receiverId);
  if (!allowed) {
    return { error: "You are not authorized to message this user for this issue" };
  }

  // Validate content (allow empty content if there's an attachment)
  if (!content.trim() && !attachment) {
    return { error: "Message cannot be empty" };
  }

  if (content.length > 5000) {
    return { error: "Message is too long (max 5000 characters)" };
  }

  // Insert message
  const { data: message, error: insertError } = await supabase
    .from("messages")
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      issue_id: issueId,
      content: content.trim() || (attachment ? `Sent a file: ${attachment.name}` : ""),
      is_read: false,
      attachment_url: attachment?.url || null,
      attachment_name: attachment?.name || null,
      attachment_type: attachment?.type || null,
      attachment_size: attachment?.size || null,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Error sending message:", insertError);
    return { error: "Failed to send message" };
  }

  revalidatePath("/messages");
  revalidatePath(`/messages/${issueId}/${receiverId}`);

  return { success: true, message };
}

// Upload a file attachment
export async function uploadAttachment(formData: FormData) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "You must be logged in to upload files" };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { error: "No file provided" };
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return { error: "File size must be less than 5MB" };
  }

  // Generate unique file path
  const fileExt = file.name.split(".").pop();
  const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("chat-attachments")
    .upload(filePath, file);

  if (uploadError) {
    console.error("Error uploading file:", uploadError);
    return { error: "Failed to upload file" };
  }

  // Store the file path (not public URL) - we'll generate signed URLs on demand
  return {
    success: true,
    attachment: {
      url: uploadData.path, // Store path, not public URL
      name: file.name,
      type: file.type,
      size: file.size,
    },
  };
}

// Generate a signed URL for accessing a private file (valid for 1 hour)
export async function getSignedUrl(filePath: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("getSignedUrl auth error:", authError);
    return { error: "You must be logged in to access files" };
  }

  // Clean up the file path - remove any URL prefix if present (for old uploads)
  let cleanPath = filePath;
  if (filePath.includes("/chat-attachments/")) {
    cleanPath = filePath.split("/chat-attachments/").pop() || filePath;
  }

  console.log("getSignedUrl - Original path:", filePath);
  console.log("getSignedUrl - Clean path:", cleanPath);

  // Generate signed URL valid for 1 hour (3600 seconds)
  const { data, error } = await supabase.storage
    .from("chat-attachments")
    .createSignedUrl(cleanPath, 3600);

  if (error) {
    console.error("Error generating signed URL:", error, "for path:", cleanPath);
    return { error: `Failed to generate file URL: ${error.message}` };
  }

  console.log("getSignedUrl - Success, signed URL generated");
  return { url: data.signedUrl };
}

// Get messages between current user and another user for a specific issue
export async function getMessages(issueId: string, otherUserId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: "Not authenticated" };

  // Verify the user can access these messages
  const allowed = await canMessage(issueId, otherUserId);
  if (!allowed) {
    return { data: [], error: "Not authorized" };
  }

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("issue_id", issueId)
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    return { data: [], error: "Failed to fetch messages" };
  }

  return { data: data || [], error: null };
}

// Get all conversations for current user
export async function getConversations() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: "Not authenticated" };

  // Use the custom function we created in the migration
  const { data, error } = await supabase.rpc("get_conversations", {
    user_uuid: user.id,
  });

  if (error) {
    console.error("Error fetching conversations:", error);
    return { data: [], error: "Failed to fetch conversations" };
  }

  return { data: data || [], error: null };
}

// Mark messages as read
export async function markMessagesAsRead(issueId: string, senderId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("issue_id", issueId)
    .eq("sender_id", senderId)
    .eq("receiver_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("Error marking messages as read:", error);
    return { error: "Failed to mark messages as read" };
  }

  return { success: true };
}

// Get total unread message count
export async function getUnreadMessageCount() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }

  return count || 0;
}

// Get conversation context (issue and participant info)
export async function getConversationContext(issueId: string, participantId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get issue info
  const { data: issue } = await supabase
    .from("issues")
    .select("id, title, status, business_id")
    .eq("id", issueId)
    .single();

  if (!issue) return null;

  // Get business profile for the issue
  const { data: issueBusinessProfile } = await supabase
    .from("business_profiles")
    .select("user_id, business_name, avatar_url")
    .eq("id", issue.business_id)
    .single();

  if (!issueBusinessProfile) return null;

  // Get participant info - could be student or business
  const { data: participantUser } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", participantId)
    .single();

  if (!participantUser) return null;

  let participantName: string | null = null;
  let participantAvatar: string | null = null;

  if (participantUser.role === "student") {
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("full_name, avatar_url")
      .eq("user_id", participantId)
      .single();
    
    if (profile) {
      participantName = profile.full_name;
      participantAvatar = profile.avatar_url;
    }
  } else if (participantUser.role === "business") {
    const { data: profile } = await supabase
      .from("business_profiles")
      .select("owner_name, business_name, avatar_url")
      .eq("user_id", participantId)
      .single();
    
    if (profile) {
      participantName = profile.business_name || profile.owner_name || participantName;
      participantAvatar = profile.avatar_url;
    }
  }

  return {
    issue: {
      id: issue.id,
      title: issue.title,
      status: issue.status,
    },
    participant: {
      id: participantId,
      name: participantName,
      avatar: participantAvatar,
      role: participantUser.role,
    },
    isBusinessOwner: issueBusinessProfile.user_id === user.id,
  };
}

