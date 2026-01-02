"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

interface RealtimeRefreshProps {
  tables: Array<{
    name: string;
    event?: "INSERT" | "UPDATE" | "DELETE" | "*";
    filter?: string;
  }>;
}

/**
 * Component that listens to Supabase Realtime events and refreshes the page
 * when relevant changes occur. Use this for server components that need
 * to reflect real-time data changes.
 */
export function RealtimeRefresh({ tables }: RealtimeRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Create a unique channel name based on tables being watched
    const channelName = `realtime-refresh-${tables.map((t) => t.name).join("-")}`;

    let channel = supabase.channel(channelName);

    // Subscribe to each table
    tables.forEach((table) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      channel = (channel as any).on(
        "postgres_changes",
        {
          event: table.event || "*",
          schema: "public",
          table: table.name,
          filter: table.filter,
        },
        () => {
          // Refresh the page when any change occurs
          router.refresh();
        }
      );
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tables, router]);

  // This component doesn't render anything
  return null;
}




