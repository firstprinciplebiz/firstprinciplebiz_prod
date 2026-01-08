"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { getUnreadMessageCount } from "@/lib/messages/actions";

export function MessageBadge() {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    const count = await getUnreadMessageCount();
    setUnreadCount(count);
  };

  useEffect(() => {
    fetchUnreadCount();

    // Set up Supabase Realtime subscription for new messages
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel("message-count")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          // Refresh count on any message change
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Link
      href="/messages"
      className="relative flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
    >
      <MessageSquare className="w-4 h-4" />
      Messages
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}

// Mobile version
export function MessageBadgeMobile({ onClick }: { onClick?: () => void }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    const count = await getUnreadMessageCount();
    setUnreadCount(count);
  };

  useEffect(() => {
    fetchUnreadCount();

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel("message-count-mobile")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Link
      href="/messages"
      onClick={onClick}
      className="relative flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-lg"
    >
      <MessageSquare className="w-5 h-5" />
      Messages
      {unreadCount > 0 && (
        <span className="ml-auto min-w-[20px] h-[20px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1.5">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}






