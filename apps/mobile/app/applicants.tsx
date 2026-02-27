import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { User, CheckCircle, XCircle, MessageCircle } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Applicant {
  id: string;
  status: string;
  cover_message: string;
  created_at: string;
  student_profiles: {
    id: string;
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    university_name: string;
    major: string;
  };
  issues: {
    id: string;
    title: string;
  };
}

export default function ApplicantsScreen() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  const fetchApplicants = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("business_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) return;

      // Get all issues for this business
      const { data: issues } = await supabase
        .from("issues")
        .select("id")
        .eq("business_id", profile.id);

      if (!issues || issues.length === 0) {
        setApplicants([]);
        return;
      }

      const issueIds = issues.map((i) => i.id);

      // Get pending applicants for these issues
      const { data } = await supabase
        .from("issue_interests")
        .select(`
          id,
          status,
          cover_message,
          created_at,
          student_profiles(id, user_id, full_name, avatar_url, university_name, major),
          issues(id, title)
        `)
        .in("issue_id", issueIds)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      setApplicants((data as Applicant[]) || []);
    } catch (error) {
      console.error("Error fetching applicants:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchApplicants();
  }, [fetchApplicants]);

  const handleAction = async (applicantId: string, action: "approve" | "reject") => {
    setActionLoading(applicantId);
    try {
      const applicant = applicants.find((a) => a.id === applicantId);
      if (!applicant) throw new Error("Applicant not found");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("issue_interests")
        .update({ status: action === "approve" ? "approved" : "rejected" })
        .eq("id", applicantId);

      if (error) throw error;

      // If approved, update issue status to in_progress_accepting if it's currently "open"
      if (action === "approve" && applicant.issues) {
        const { data: currentIssue } = await supabase
          .from("issues")
          .select("status")
          .eq("id", applicant.issues.id)
          .single();

        if (currentIssue?.status === "open") {
          await supabase
            .from("issues")
            .update({ status: "in_progress_accepting", updated_at: new Date().toISOString() })
            .eq("id", applicant.issues.id);
        }
      }

      // If approved, send a welcome message to unlock chat
      if (action === "approve" && applicant.student_profiles && applicant.issues) {
        const welcomeMessage = `Welcome! You've been approved to work on "${applicant.issues.title}". I'm excited to collaborate with you. Feel free to ask any questions about the project!`;
        
        const { error: messageError } = await supabase
          .from("messages")
          .insert({
            sender_id: user.id, // Business owner
            receiver_id: applicant.student_profiles.user_id,
            issue_id: applicant.issues.id,
            content: welcomeMessage,
            is_read: false,
          });

        if (messageError) {
          console.error("Error creating welcome message:", messageError);
          // Don't fail the approval if message fails
        }
      }

      // Remove from list
      setApplicants((prev) => prev.filter((a) => a.id !== applicantId));
      Alert.alert(
        "Success",
        `Application ${action === "approve" ? "approved" : "rejected"}`
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update application");
    } finally {
      setActionLoading(null);
    }
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
      <Stack.Screen options={{ title: "Applicants" }} />
      <ScrollView
        className="flex-1 bg-slate-50"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingTop: 16 }}
      >
        <View className="px-4 pb-4">
          {applicants.length === 0 ? (
            <Card className="p-8 items-center">
              <View className="w-16 h-16 bg-slate-100 rounded-full items-center justify-center mb-4">
                <User color="#94A3B8" size={32} />
              </View>
              <Text className="text-lg font-semibold text-slate-900 mb-2">
                No pending applications
              </Text>
              <Text className="text-slate-600 text-center">
                When students apply to your issues, their applications will
                appear here.
              </Text>
            </Card>
          ) : (
            <View className="space-y-3">
              {applicants.map((applicant) => (
                <Card key={applicant.id} className="p-4">
                  <TouchableOpacity
                    className="flex-row items-center mb-3"
                    onPress={() =>
                      router.push(`/profile/student/${applicant.student_profiles?.id}`)
                    }
                  >
                    <View className="w-12 h-12 rounded-full bg-slate-100 items-center justify-center overflow-hidden">
                      {applicant.student_profiles?.avatar_url ? (
                        <Image
                          source={{ uri: applicant.student_profiles.avatar_url }}
                          className="w-full h-full"
                        />
                      ) : (
                        <User color="#94A3B8" size={24} />
                      )}
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="font-semibold text-slate-900">
                        {applicant.student_profiles?.full_name}
                      </Text>
                      <Text className="text-sm text-slate-500">
                        {applicant.student_profiles?.university_name}
                      </Text>
                    </View>
                    <Badge variant="primary">View Profile</Badge>
                  </TouchableOpacity>

                  <View className="bg-slate-50 p-3 rounded-lg mb-3">
                    <Text className="text-xs text-slate-500 mb-1">
                      Applied for: {applicant.issues?.title}
                    </Text>
                    <Text className="text-slate-700">
                      "{applicant.cover_message}"
                    </Text>
                  </View>

                  <View className="flex-row space-x-2">
                    <TouchableOpacity
                      className={`flex-1 flex-row items-center justify-center py-2.5 rounded-lg ${
                        actionLoading === applicant.id
                          ? "bg-green-400"
                          : "bg-green-500"
                      }`}
                      onPress={() => handleAction(applicant.id, "approve")}
                      disabled={actionLoading === applicant.id}
                    >
                      {actionLoading === applicant.id ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <>
                          <CheckCircle color="white" size={18} />
                          <Text className="text-white font-medium ml-1.5">
                            Approve
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-1 flex-row items-center justify-center py-2.5 bg-slate-200 rounded-lg"
                      onPress={() => handleAction(applicant.id, "reject")}
                      disabled={actionLoading === applicant.id}
                    >
                      <XCircle color="#64748B" size={18} />
                      <Text className="text-slate-700 font-medium ml-1.5">
                        Reject
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

