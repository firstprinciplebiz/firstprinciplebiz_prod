import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import {
  Building2,
  Clock,
  DollarSign,
  Users,
  Calendar,
  MessageCircle,
  ChevronRight,
} from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface Issue {
  id: string;
  title: string;
  description: string;
  expectations: string;
  status: string;
  compensation_type: string;
  compensation_amount: number | null;
  duration_days: number | null;
  required_skills: string[];
  max_students: number;
  current_students: number;
  created_at: string;
  business_profiles: {
    id: string;
    user_id: string;
    business_name: string;
    industry: string;
    address: string;
    avatar_url: string | null;
  };
}

export default function IssueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverMessage, setCoverMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch issue
        const { data: issueData, error: issueError } = await supabase
          .from("issues")
          .select(`
            *,
            business_profiles(id, user_id, business_name, industry, address, avatar_url)
          `)
          .eq("id", id)
          .single();

        if (issueError) throw issueError;
        setIssue(issueData);

        // Get user and check if student
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userData } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

          setUserRole(userData?.role || null);

          if (userData?.role === "student") {
            // Check if already applied
            const { data: profile } = await supabase
              .from("student_profiles")
              .select("id")
              .eq("user_id", user.id)
              .single();

            if (profile) {
              const { data: interest } = await supabase
                .from("issue_interests")
                .select("status")
                .eq("issue_id", id)
                .eq("student_id", profile.id)
                .single();

              if (interest) {
                setHasApplied(true);
                setApplicationStatus(interest.status);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching issue:", error);
        Alert.alert("Error", "Failed to load issue details");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const handleApply = async () => {
    if (!coverMessage.trim()) {
      Alert.alert("Error", "Please enter a cover message");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("student_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) throw new Error("Student profile not found");

      const { error } = await supabase.from("issue_interests").insert({
        issue_id: id,
        student_id: profile.id,
        cover_message: coverMessage,
        status: "pending",
      });

      if (error) throw error;

      setHasApplied(true);
      setApplicationStatus("pending");
      setShowApplyModal(false);
      setCoverMessage("");
      Alert.alert("Success", "Your application has been submitted!");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
      case "approved":
        return <Badge variant="success">Approved</Badge>;
      case "rejected":
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!issue) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center p-4">
        <Text className="text-lg text-slate-600">Issue not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Issue Details" }} />
      <ScrollView className="flex-1 bg-slate-50">
        <View className="p-4">
          {/* Header */}
          <Card className="p-4 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Badge
                variant={
                  issue.compensation_type === "paid"
                    ? "success"
                    : issue.compensation_type === "voluntary"
                    ? "secondary"
                    : "warning"
                }
              >
                {issue.compensation_type}
              </Badge>
              {issue.compensation_amount && (
                <Text className="text-green-600 font-semibold">
                  ${issue.compensation_amount}
                </Text>
              )}
            </View>
            <Text className="text-xl font-bold text-slate-900 mb-2">
              {issue.title}
            </Text>
            <Text className="text-slate-600">{issue.description}</Text>
          </Card>

          {/* Business Info */}
          <TouchableOpacity
            onPress={() => router.push(`/profile/business/${issue.business_profiles.id}`)}
          >
            <Card className="p-4 mb-4">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-xl bg-slate-100 items-center justify-center overflow-hidden">
                  {issue.business_profiles.avatar_url ? (
                    <Image
                      source={{ uri: issue.business_profiles.avatar_url }}
                      className="w-full h-full"
                    />
                  ) : (
                    <Building2 color="#94A3B8" size={24} />
                  )}
                </View>
                <View className="flex-1 ml-3">
                  <Text className="font-semibold text-slate-900">
                    {issue.business_profiles.business_name}
                  </Text>
                  <Text className="text-sm text-slate-500">
                    {issue.business_profiles.industry}
                  </Text>
                </View>
                <ChevronRight color="#94A3B8" size={20} />
              </View>
            </Card>
          </TouchableOpacity>

          {/* Details */}
          <Card className="p-4 mb-4">
            <Text className="font-semibold text-slate-900 mb-3">Details</Text>
            <View className="space-y-3">
              {issue.duration_days && (
                <View className="flex-row items-center">
                  <Calendar color="#64748B" size={18} />
                  <Text className="text-slate-600 ml-2">
                    Duration: {issue.duration_days} days
                  </Text>
                </View>
              )}
              <View className="flex-row items-center">
                <Users color="#64748B" size={18} />
                <Text className="text-slate-600 ml-2">
                  {issue.current_students}/{issue.max_students} students
                </Text>
              </View>
              <View className="flex-row items-center">
                <Clock color="#64748B" size={18} />
                <Text className="text-slate-600 ml-2">
                  Posted {new Date(issue.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </Card>

          {/* Expectations */}
          {issue.expectations && (
            <Card className="p-4 mb-4">
              <Text className="font-semibold text-slate-900 mb-2">
                Expectations
              </Text>
              <Text className="text-slate-600">{issue.expectations}</Text>
            </Card>
          )}

          {/* Required Skills */}
          {issue.required_skills && issue.required_skills.length > 0 && (
            <Card className="p-4 mb-4">
              <Text className="font-semibold text-slate-900 mb-3">
                Required Skills
              </Text>
              <View className="flex-row flex-wrap">
                {issue.required_skills.map((skill) => (
                  <Badge key={skill} variant="primary" className="mr-1.5 mb-1.5">
                    {skill}
                  </Badge>
                ))}
              </View>
            </Card>
          )}

          {/* Action Button */}
          {userRole === "student" && (
            <View className="mt-2 mb-6">
              {hasApplied ? (
                <Card className="p-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-slate-600">Application Status:</Text>
                    {getStatusBadge(applicationStatus || "")}
                  </View>
                  {applicationStatus === "approved" && (
                    <TouchableOpacity
                      className="flex-row items-center justify-center mt-4 py-3 bg-primary rounded-xl"
                      onPress={() =>
                        router.push(
                          `/chat/${issue.id}/${issue.business_profiles.user_id}`
                        )
                      }
                    >
                      <MessageCircle color="white" size={20} />
                      <Text className="text-white font-semibold ml-2">
                        Message Business
                      </Text>
                    </TouchableOpacity>
                  )}
                </Card>
              ) : (
                <Button onPress={() => setShowApplyModal(true)}>
                  Apply for this Issue
                </Button>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Apply Modal */}
      <Modal visible={showApplyModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-slate-900 mb-2">
              Apply for Issue
            </Text>
            <Text className="text-slate-600 mb-4">
              Write a message explaining why you're a good fit for this project.
            </Text>
            <TextInput
              className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 min-h-[120px]"
              placeholder="Enter your cover message..."
              placeholderTextColor="#94A3B8"
              value={coverMessage}
              onChangeText={setCoverMessage}
              multiline
              textAlignVertical="top"
            />
            <View className="flex-row space-x-3 mt-4">
              <TouchableOpacity
                className="flex-1 py-3 bg-slate-100 rounded-xl"
                onPress={() => setShowApplyModal(false)}
              >
                <Text className="text-center font-semibold text-slate-600">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-xl ${
                  isSubmitting ? "bg-primary/70" : "bg-primary"
                }`}
                onPress={handleApply}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-center font-semibold text-white">
                    Submit
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}





