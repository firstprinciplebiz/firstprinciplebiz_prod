import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import {
  FileText,
  Plus,
  Users,
  MoreVertical,
  CheckCircle,
  StopCircle,
  Trash2,
} from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Issue {
  id: string;
  title: string;
  status: string;
  compensation_type: string;
  created_at: string;
  current_students: number;
  max_students: number;
}

type FilterType = "all" | "open" | "in_progress" | "completed";

export default function MyIssuesScreen() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const router = useRouter();
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  
  const activeFilter: FilterType = (filter as FilterType) || "all";

  const fetchIssues = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("business_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) return;

      const { data } = await supabase
        .from("issues")
        .select("*")
        .eq("business_id", profile.id)
        .order("created_at", { ascending: false });

      setIssues(data || []);
    } catch (error) {
      console.error("Error fetching issues:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchIssues();
  }, [fetchIssues]);

  // Filter issues based on active filter
  const filteredIssues = issues.filter((issue) => {
    switch (activeFilter) {
      case "open":
        return issue.status === "open";
      case "in_progress":
        return issue.status === "in_progress_accepting" || issue.status === "in_progress_full";
      case "completed":
        return issue.status === "completed" || issue.status === "closed";
      case "all":
      default:
        return true;
    }
  });

  const getFilterTitle = () => {
    switch (activeFilter) {
      case "open":
        return "Open Issues";
      case "in_progress":
        return "In Progress Issues";
      case "completed":
        return "Completed Issues";
      default:
        return "My Issues";
    }
  };

  const handleUpdateStatus = async (issueId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("issues")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", issueId);

      if (error) throw error;

      // If marking as fully staffed, auto-reject all pending applications
      if (newStatus === "in_progress_full") {
        await supabase
          .from("issue_interests")
          .update({ status: "rejected", updated_at: new Date().toISOString() })
          .eq("issue_id", issueId)
          .eq("status", "pending");
      }

      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === issueId ? { ...issue, status: newStatus } : issue
        )
      );
      setShowActionsModal(false);
      Alert.alert("Success", "Issue status updated");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteIssue = async (issueId: string) => {
    Alert.alert(
      "Delete Issue",
      "Are you sure you want to delete this issue? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            try {
              const { error } = await supabase
                .from("issues")
                .delete()
                .eq("id", issueId);

              if (error) throw error;

              setIssues((prev) => prev.filter((issue) => issue.id !== issueId));
              setShowActionsModal(false);
              Alert.alert("Success", "Issue deleted");
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete issue");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="success">Open</Badge>;
      case "in_progress_accepting":
        return <Badge variant="primary">Accepting Candidates</Badge>;
      case "in_progress_full":
        return <Badge variant="warning">Fully Staffed</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      case "closed":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return null;
    }
  };

  const getAvailableActions = (issue: Issue) => {
    const actions: { label: string; icon: any; action: () => void; destructive?: boolean }[] = [];

    if (issue.status === "open") {
      actions.push({
        label: "Mark as Fully Staffed",
        icon: StopCircle,
        action: () => handleUpdateStatus(issue.id, "in_progress_full"),
      });
    }

    if (issue.status === "in_progress_full") {
      actions.push({
        label: "Accept More Candidates",
        icon: Users,
        action: () => handleUpdateStatus(issue.id, "in_progress_accepting"),
      });
    }

    if (issue.status === "in_progress_accepting") {
      actions.push({
        label: "Mark as Fully Staffed",
        icon: StopCircle,
        action: () => handleUpdateStatus(issue.id, "in_progress_full"),
      });
    }

    if (
      issue.status !== "completed" &&
      issue.status !== "closed"
    ) {
      actions.push({
        label: "Mark as Completed",
        icon: CheckCircle,
        action: () => handleUpdateStatus(issue.id, "completed"),
      });
    }

    actions.push({
      label: "Cancel Issue",
      icon: Trash2,
      action: () => handleDeleteIssue(issue.id),
      destructive: true,
    });

    return actions;
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
      <Stack.Screen
        options={{
          title: getFilterTitle(),
          headerRight: () => (
            <TouchableOpacity
              className="mr-4"
              onPress={() => router.push("/issues/new")}
            >
              <Plus color="#2563EB" size={24} />
            </TouchableOpacity>
          ),
        }}
      />
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
                { key: "open", label: "Open" },
                { key: "in_progress", label: "In Progress" },
                { key: "completed", label: "Completed" },
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

          {filteredIssues.length === 0 ? (
            <Card className="p-8 items-center">
              <View className="w-16 h-16 bg-slate-100 rounded-full items-center justify-center mb-4">
                <FileText color="#94A3B8" size={32} />
              </View>
              <Text className="text-lg font-semibold text-slate-900 mb-2">
                {activeFilter === "all" ? "No issues yet" : `No ${activeFilter.replace("_", " ")} issues`}
              </Text>
              <Text className="text-slate-600 text-center mb-4">
                {activeFilter === "all" 
                  ? "Post your first issue to start receiving applications from students."
                  : `You don't have any ${activeFilter.replace("_", " ")} issues.`}
              </Text>
              {activeFilter === "all" && (
                <TouchableOpacity
                  className="bg-primary py-3 px-6 rounded-xl"
                  onPress={() => router.push("/issues/new")}
                >
                  <Text className="text-white font-semibold">Post an Issue</Text>
                </TouchableOpacity>
              )}
            </Card>
          ) : (
            <View className="space-y-3">
              {filteredIssues.map((issue) => (
                <Card key={issue.id} className="p-4">
                  <TouchableOpacity
                    onPress={() => router.push(`/issues/${issue.id}`)}
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <Text className="font-semibold text-slate-900 flex-1 mr-2">
                        {issue.title}
                      </Text>
                      {getStatusBadge(issue.status)}
                    </View>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Users color="#64748B" size={14} />
                        <Text className="text-sm text-slate-600 ml-1">
                          {issue.current_students}/{issue.max_students} students
                        </Text>
                      </View>
                      <Text className="text-xs text-slate-400">
                        {new Date(issue.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <Text className="text-sm text-slate-500 capitalize">
                      {issue.compensation_type}
                    </Text>
                    <TouchableOpacity
                      className="flex-row items-center px-3 py-1.5 bg-slate-100 rounded-lg"
                      onPress={() => {
                        setSelectedIssue(issue);
                        setShowActionsModal(true);
                      }}
                    >
                      <MoreVertical color="#64748B" size={16} />
                      <Text className="text-slate-600 text-sm ml-1">Actions</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Actions Modal */}
      <Modal visible={showActionsModal} animationType="slide" transparent>
        <TouchableOpacity
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={() => setShowActionsModal(false)}
        >
          <View className="flex-1 justify-end">
            <View className="bg-white rounded-t-3xl p-6">
              <Text className="text-xl font-bold text-slate-900 mb-2">
                Issue Actions
              </Text>
              <Text className="text-slate-600 mb-4" numberOfLines={1}>
                {selectedIssue?.title}
              </Text>

              {selectedIssue && (
                <View className="space-y-2">
                  {getAvailableActions(selectedIssue).map((action, index) => (
                    <TouchableOpacity
                      key={index}
                      className={`flex-row items-center p-4 rounded-xl ${
                        action.destructive ? "bg-red-50" : "bg-slate-50"
                      }`}
                      onPress={action.action}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <ActivityIndicator
                          size="small"
                          color={action.destructive ? "#EF4444" : "#64748B"}
                        />
                      ) : (
                        <action.icon
                          color={action.destructive ? "#EF4444" : "#64748B"}
                          size={20}
                        />
                      )}
                      <Text
                        className={`ml-3 font-medium ${
                          action.destructive ? "text-red-600" : "text-slate-700"
                        }`}
                      >
                        {action.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                className="mt-4 py-3 bg-slate-100 rounded-xl"
                onPress={() => setShowActionsModal(false)}
              >
                <Text className="text-center font-semibold text-slate-600">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
