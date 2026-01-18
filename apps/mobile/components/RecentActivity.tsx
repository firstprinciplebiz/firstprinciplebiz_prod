import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import {
  FileText,
  CheckCircle,
  MessageSquare,
  Briefcase,
  Clock,
  ChevronRight,
} from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";

interface Activity {
  id: string;
  type: "application" | "approval" | "message" | "issue_update";
  title: string;
  description: string;
  timestamp: string;
  link?: string;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!userData) return;

        const allActivities: Activity[] = [];

        if (userData.role === "student") {
          // Get recent applications
          const { data: profile } = await supabase
            .from("student_profiles")
            .select("id")
            .eq("user_id", user.id)
            .single();

          if (profile) {
            // Recent applications
            const { data: applications } = await supabase
              .from("issue_interests")
              .select(`
                id,
                status,
                created_at,
                issues(id, title, business_profiles(business_name))
              `)
              .eq("student_id", profile.id)
              .order("created_at", { ascending: false })
              .limit(5);

            applications?.forEach((app: any) => {
              allActivities.push({
                id: app.id,
                type: app.status === "approved" ? "approval" : "application",
                title: app.status === "approved" 
                  ? "Application Approved" 
                  : "Application Submitted",
                description: `For: ${app.issues?.title || "Issue"}`,
                timestamp: app.created_at,
                link: `/issues/${app.issues?.id}`,
              });
            });

            // Recent messages (last message in each conversation)
            const { data: recentMessages } = await supabase
              .from("messages")
              .select(`
                id,
                content,
                created_at,
                issue_id,
                sender_id,
                receiver_id,
                issues(title)
              `)
              .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
              .order("created_at", { ascending: false })
              .limit(5);

            recentMessages?.forEach((msg: any) => {
              const isFromMe = msg.sender_id === user.id;
              allActivities.push({
                id: msg.id,
                type: "message",
                title: isFromMe ? "Message Sent" : "New Message",
                description: isFromMe 
                  ? `To: ${msg.issues?.title || "Issue"}` 
                  : `From: ${msg.issues?.title || "Issue"}`,
                timestamp: msg.created_at,
                link: `/chat/${msg.issue_id}/${isFromMe ? msg.receiver_id : msg.sender_id}`,
              });
            });
          }
        } else {
          // Business activities
          const { data: profile } = await supabase
            .from("business_profiles")
            .select("id")
            .eq("user_id", user.id)
            .single();

          if (profile) {
            // Get business issue IDs first
            const { data: businessIssues } = await supabase
              .from("issues")
              .select("id")
              .eq("business_id", profile.id);

            const issueIds = businessIssues?.map(i => i.id) || [];

            // Recent applications/interests
            let interests = null;
            if (issueIds.length > 0) {
              const result = await supabase
                .from("issue_interests")
                .select(`
                  id,
                  status,
                  created_at,
                  issues(id, title)
                `)
                .in("issue_id", issueIds)
                .order("created_at", { ascending: false })
                .limit(5);
              interests = result.data;
            }

            interests?.forEach((interest: any) => {
              allActivities.push({
                id: interest.id,
                type: interest.status === "approved" ? "approval" : "application",
                title: interest.status === "approved"
                  ? "Application Approved"
                  : "New Application",
                description: `For: ${interest.issues?.title || "Issue"}`,
                timestamp: interest.created_at,
                link: `/applicants`,
              });
            });

            // Recent messages
            const { data: recentMessages } = await supabase
              .from("messages")
              .select(`
                id,
                content,
                created_at,
                issue_id,
                sender_id,
                receiver_id,
                issues(title)
              `)
              .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
              .order("created_at", { ascending: false })
              .limit(5);

            recentMessages?.forEach((msg: any) => {
              const isFromMe = msg.sender_id === user.id;
              allActivities.push({
                id: msg.id,
                type: "message",
                title: isFromMe ? "Message Sent" : "New Message",
                description: isFromMe
                  ? `To: ${msg.issues?.title || "Issue"}`
                  : `From: ${msg.issues?.title || "Issue"}`,
                timestamp: msg.created_at,
                link: `/chat/${msg.issue_id}/${isFromMe ? msg.receiver_id : msg.sender_id}`,
              });
            });
          }
        }

        // Sort by timestamp and take top 5
        allActivities.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setActivities(allActivities.slice(0, 5));
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "application":
        return <FileText color="#3B82F6" size={20} />;
      case "approval":
        return <CheckCircle color="#22C55E" size={20} />;
      case "message":
        return <MessageSquare color="#8B5CF6" size={20} />;
      case "issue_update":
        return <Briefcase color="#06B6D4" size={20} />;
      default:
        return <Clock color="#64748B" size={20} />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
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
      <Card className="p-4">
        <ActivityIndicator size="small" color="#2563EB" />
      </Card>
    );
  }

  if (activities.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 mb-4">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-semibold text-slate-900">Recent Activity</Text>
        <TouchableOpacity onPress={() => router.push("/my-applications")}>
          <Text className="text-primary text-sm font-medium">View All</Text>
        </TouchableOpacity>
      </View>
      <View className="space-y-3">
        {activities.map((activity) => (
          <TouchableOpacity
            key={activity.id}
            onPress={() => activity.link && router.push(activity.link)}
            className="flex-row items-center"
          >
            <View className="w-10 h-10 rounded-lg bg-slate-100 items-center justify-center mr-3">
              {getActivityIcon(activity.type)}
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-slate-900">
                {activity.title}
              </Text>
              <Text className="text-xs text-slate-500" numberOfLines={1}>
                {activity.description}
              </Text>
              <Text className="text-xs text-slate-400 mt-0.5">
                {formatTime(activity.timestamp)}
              </Text>
            </View>
            {activity.link && (
              <ChevronRight color="#94A3B8" size={16} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  );
}

