import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { FileText, CheckCircle, XCircle, Clock, ChevronRight } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Application {
  id: string;
  status: string;
  cover_message: string;
  created_at: string;
  issues: {
    id: string;
    title: string;
    status: string;
    compensation_type: string;
    business_profiles: {
      business_name: string;
    };
  };
}

type FilterType = "all" | "approved" | "in_progress" | "closed" | "pending" | "rejected";

export default function MyApplicationsScreen() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  
  const activeFilter: FilterType = (filter as FilterType) || "all";

  const fetchApplications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("student_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) return;

      const { data } = await supabase
        .from("issue_interests")
        .select(`
          id,
          status,
          cover_message,
          created_at,
          issues(
            id,
            title,
            status,
            compensation_type,
            business_profiles(business_name)
          )
        `)
        .eq("student_id", profile.id)
        .order("created_at", { ascending: false });

      setApplications((data as Application[]) || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchApplications();
  }, [fetchApplications]);

  // Filter applications based on active filter
  const filteredApplications = applications.filter((app) => {
    switch (activeFilter) {
      case "approved":
        // Approved applications where issue is in progress or closed (combination of both)
        return app.status === "approved" && 
          (app.issues?.status === "in_progress_accepting" || 
           app.issues?.status === "in_progress_full" ||
           app.issues?.status === "completed" || 
           app.issues?.status === "closed");
      case "in_progress":
        // Approved applications where issue is in progress
        return app.status === "approved" && 
          (app.issues?.status === "in_progress_accepting" || app.issues?.status === "in_progress_full");
      case "closed":
        // Approved applications where issue is completed/closed
        return app.status === "approved" && 
          (app.issues?.status === "completed" || app.issues?.status === "closed");
      case "pending":
        return app.status === "pending";
      case "rejected":
        return app.status === "rejected";
      case "all":
      default:
        return true;
    }
  });

  const getFilterTitle = () => {
    switch (activeFilter) {
      case "approved":
        return "Approved Applications";
      case "in_progress":
        return "In Progress";
      case "closed":
        return "Closed Issues";
      case "pending":
        return "Pending Applications";
      case "rejected":
        return "Rejected Applications";
      default:
        return "My Applications";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle color="#16A34A" size={20} />;
      case "rejected":
        return <XCircle color="#DC2626" size={20} />;
      default:
        return <Clock color="#D97706" size={20} />;
    }
  };

  const getStatusBadge = (appStatus: string, issueStatus: string) => {
    if (appStatus === "pending") {
      return <Badge variant="warning">Pending</Badge>;
    } else if (appStatus === "rejected") {
      return <Badge variant="danger">Rejected</Badge>;
    } else if (appStatus === "approved") {
      if (issueStatus === "completed" || issueStatus === "closed") {
        return <Badge variant="success">Completed</Badge>;
      }
      if (issueStatus === "in_progress_accepting" || issueStatus === "in_progress_full") {
        return <Badge variant="primary">In Progress</Badge>;
      }
      return <Badge variant="success">Approved</Badge>;
    }
    return null;
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: getFilterTitle() }} />
      <ScrollView
        className="flex-1 bg-slate-50"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingTop: 16 }}
      >
        <View className="px-4 pb-4">
          {/* Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 -mx-4 px-4">
            <View className="flex-row space-x-2">
              {[
                { key: "all", label: "All" },
                { key: "pending", label: "Pending" },
                { key: "approved", label: "Approved" },
                { key: "in_progress", label: "In Progress" },
                { key: "closed", label: "Closed" },
                { key: "rejected", label: "Rejected" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  className={`px-4 py-2 rounded-full ${
                    activeFilter === item.key
                      ? "bg-primary"
                      : "bg-white border border-slate-200"
                  }`}
                  onPress={() => router.setParams({ filter: item.key === "all" ? undefined : item.key })}
                >
                  <Text
                    className={`text-sm font-medium ${
                      activeFilter === item.key ? "text-white" : "text-slate-600"
                    }`}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {filteredApplications.length === 0 ? (
            <Card className="p-8 items-center">
              <View className="w-16 h-16 bg-slate-100 rounded-full items-center justify-center mb-4">
                <FileText color="#94A3B8" size={32} />
              </View>
              <Text className="text-lg font-semibold text-slate-900 mb-2">
                No applications found
              </Text>
              <Text className="text-slate-600 text-center mb-4">
                {activeFilter === "all" 
                  ? "Start by browsing available issues and applying for ones that interest you."
                  : `No ${activeFilter.replace("_", " ")} applications found.`}
              </Text>
              {activeFilter === "all" && (
                <TouchableOpacity
                  className="bg-primary py-3 px-6 rounded-xl"
                  onPress={() => router.push("/(tabs)/issues")}
                >
                  <Text className="text-white font-semibold">Browse Issues</Text>
                </TouchableOpacity>
              )}
            </Card>
          ) : (
            <View className="space-y-3">
              {filteredApplications.map((app) => (
                <TouchableOpacity
                  key={app.id}
                  onPress={() => router.push(`/issues/${app.issues?.id}`)}
                >
                  <Card className="p-4">
                    <View className="flex-row items-start">
                      <View className="mr-3 mt-1">
                        {getStatusIcon(app.status)}
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="font-semibold text-slate-900 flex-1 mr-2">
                            {app.issues?.title}
                          </Text>
                          {getStatusBadge(app.status, app.issues?.status)}
                        </View>
                        <Text className="text-sm text-slate-600 mb-2">
                          {app.issues?.business_profiles?.business_name}
                        </Text>
                        <Text className="text-xs text-slate-400">
                          Applied {new Date(app.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                      <ChevronRight color="#94A3B8" size={20} />
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}
