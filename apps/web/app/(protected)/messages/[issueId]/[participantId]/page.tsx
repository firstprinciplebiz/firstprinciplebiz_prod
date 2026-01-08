import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getMessages, getConversationContext, canMessage, markMessagesAsRead } from "@/lib/messages/actions";
import { ChatInterface } from "./ChatInterface";

export const dynamic = "force-dynamic";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ issueId: string; participantId: string }>;
}) {
  const { issueId, participantId } = await params;
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Check if user can access this chat
  const allowed = await canMessage(issueId, participantId);
  if (!allowed) {
    notFound();
  }

  // Get conversation context
  const context = await getConversationContext(issueId, participantId);
  if (!context) {
    notFound();
  }

  // Get existing messages
  const { data: messages, error } = await getMessages(issueId, participantId);
  if (error) {
    console.error("Error loading messages:", error);
  }

  // Check if participant account is deleted
  const { data: participantUser } = await supabase
    .from("users")
    .select("deleted_at")
    .eq("id", participantId)
    .single();

  const isParticipantDeleted = !!participantUser?.deleted_at;

  // Mark messages as read
  await markMessagesAsRead(issueId, participantId);

  return (
    <ChatInterface
      issueId={issueId}
      participantId={participantId}
      currentUserId={user.id}
      context={context}
      initialMessages={messages}
      isParticipantDeleted={isParticipantDeleted}
    />
  );
}

