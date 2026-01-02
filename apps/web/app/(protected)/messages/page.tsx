import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MessageSquare, User, Building2, Clock } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { getConversations } from "@/lib/messages/actions";

export const dynamic = "force-dynamic";

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: conversations, error } = await getConversations();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
        <p className="text-slate-600 mt-1">Your conversations with approved collaborators</p>
      </div>

      {error ? (
        <Card padding="lg" className="text-center">
          <div className="text-red-600">Failed to load conversations</div>
        </Card>
      ) : conversations.length === 0 ? (
        <Card padding="lg" className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No conversations yet</h3>
          <p className="text-slate-600 max-w-md mx-auto">
            Conversations will appear here when you're connected with businesses or students through approved applications.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {conversations.map((conversation: {
            participant_id: string;
            participant_name: string;
            participant_avatar: string | null;
            last_message: string;
            last_message_at: string;
            unread_count: number;
            issue_id: string;
            issue_title: string;
          }) => (
            <Link
              key={`${conversation.issue_id}-${conversation.participant_id}`}
              href={`/messages/${conversation.issue_id}/${conversation.participant_id}`}
            >
              <Card
                padding="md"
                className={`transition-all hover:shadow-md hover:border-primary/20 cursor-pointer ${
                  conversation.unread_count > 0 ? "border-primary/30 bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden relative flex-shrink-0">
                    {conversation.participant_avatar ? (
                      <Image
                        src={conversation.participant_avatar}
                        alt={conversation.participant_name || "User"}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-semibold truncate ${
                        conversation.unread_count > 0 ? "text-slate-900" : "text-slate-700"
                      }`}>
                        {conversation.participant_name || "Unknown User"}
                      </h3>
                      <div className="flex items-center gap-2">
                        {conversation.unread_count > 0 && (
                          <Badge variant="primary" className="text-xs">
                            {conversation.unread_count}
                          </Badge>
                        )}
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {formatTimeAgo(new Date(conversation.last_message_at))}
                        </span>
                      </div>
                    </div>

                    {/* Issue context */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                      <Building2 className="w-3 h-3" />
                      <span className="truncate">{conversation.issue_title || "Issue"}</span>
                    </div>

                    {/* Last message preview */}
                    <p className={`text-sm truncate ${
                      conversation.unread_count > 0 ? "text-slate-800 font-medium" : "text-slate-500"
                    }`}>
                      {conversation.last_message}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}




