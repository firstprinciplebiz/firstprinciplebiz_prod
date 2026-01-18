import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { FileText, CheckCircle, Clock, Users, Search, PlusCircle } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";

type UserRole = "student" | "business";

interface Stats {
  applications: number;
  approved: number;
  issuesClosed: number;
  inProgress: number;
  postedIssues?: number;
  interestedStudents?: number;
}

export default function DashboardScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [stats, setStats] = useState<Stats>({
    applications: 0,
    approved: 0,
    issuesClosed: 0,
    inProgress: 0,
  });
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user role
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!userData) return;
      setRole(userData.role);

      if (userData.role === "student") {
        // Get student profile
        const { data: profile } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          setDisplayName(profile.full_name);

          // Get applications count
          const { count: appCount } = await supabase
            .from("issue_interests")
            .select("*", { count: "exact", head: true })
            .eq("student_id", profile.id);

          // Get approved count (in progress + closed)
          const { data: approvedInterestsForCount } = await supabase
            .from("issue_interests")
            .select("issue_id, issues(status)")
            .eq("student_id", profile.id)
            .eq("status", "approved");
          
          const approvedCount = approvedInterestsForCount?.filter(
            (i: any) => i.issues && (
              i.issues.status === "in_progress_accepting" || 
              i.issues.status === "in_progress_full" ||
              i.issues.status === "completed" || 
              i.issues.status === "closed"
            )
          ).length || 0;

          // Get approved interests with issue status
          const { data: approvedInterests } = await supabase
            .from("issue_interests")
            .select("issue_id, issues(status)")
            .eq("student_id", profile.id)
            .eq("status", "approved");

          let closedCount = 0;
          let inProgressCount = 0;
          if (approvedInterests) {
            closedCount = approvedInterests.filter(
              (i: any) => i.issues && (i.issues.status === "completed" || i.issues.status === "closed")
            ).length;
            inProgressCount = approvedInterests.filter(
              (i: any) => i.issues && (i.issues.status === "in_progress_accepting" || i.issues.status === "in_progress_full")
            ).length;
          }

          setStats({
            applications: appCount || 0,
            approved: approvedCount, // This now includes in progress + closed
            issuesClosed: closedCount,
            inProgress: inProgressCount,
          });
        }
      } else {
        // Get business profile
        const { data: profile } = await supabase
          .from("business_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          setDisplayName(profile.owner_name);

          // Get issues
          const { data: issues } = await supabase
            .from("issues")
            .select("id, status")
            .eq("business_id", profile.id);

          if (issues) {
            const issueIds = issues.map((i) => i.id);
            const closedCount = issues.filter(
              (i) => i.status === "completed" || i.status === "closed"
            ).length;
            const inProgressCount = issues.filter(
              (i) => i.status === "in_progress_accepting" || i.status === "in_progress_full"
            ).length;

            let interestedCount = 0;
            if (issueIds.length > 0) {
              const { count } = await supabase
                .from("issue_interests")
                .select("*", { count: "exact", head: true })
                .in("issue_id", issueIds)
                .eq("status", "pending");
              interestedCount = count || 0;
            }

            setStats({
              applications: 0,
              approved: 0,
              issuesClosed: closedCount,
              inProgress: inProgressCount,
              postedIssues: issues.length,
              interestedStudents: interestedCount,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-4">
        {/* Welcome Section */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-slate-900">
            Welcome back, {displayName?.split(" ")[0] || "there"}! 👋
          </Text>
          <Text className="text-slate-600 mt-1">
            {role === "student"
              ? "Browse open issues and find opportunities."
              : "Post challenges and connect with students."}
          </Text>
        </View>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap -mx-1.5 mb-6">
          {role === "student" ? (
            <>
              <View className="w-1/2 px-1.5 mb-3">
                <TouchableOpacity onPress={() => router.push("/my-applications")}>
                  <Card className="p-4">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
                        <FileText color="#2563EB" size={20} />
                      </View>
                      <View className="ml-3">
                        <Text className="text-xl font-bold text-slate-900">{stats.applications}</Text>
                        <Text className="text-xs text-slate-600">Applications</Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              </View>
              <View className="w-1/2 px-1.5 mb-3">
                <TouchableOpacity onPress={() => router.push("/my-applications?filter=approved")}>
                  <Card className="p-4">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-xl bg-green-100 items-center justify-center">
                        <CheckCircle color="#16A34A" size={20} />
                      </View>
                      <View className="ml-3">
                        <Text className="text-xl font-bold text-slate-900">{stats.approved}</Text>
                        <Text className="text-xs text-slate-600">Approved</Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              </View>
              <View className="w-1/2 px-1.5 mb-3">
                <TouchableOpacity onPress={() => router.push("/my-applications?filter=closed")}>
                  <Card className="p-4">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-xl bg-emerald-100 items-center justify-center">
                        <CheckCircle color="#059669" size={20} />
                      </View>
                      <View className="ml-3">
                        <Text className="text-xl font-bold text-slate-900">{stats.issuesClosed}</Text>
                        <Text className="text-xs text-slate-600">Closed</Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              </View>
              <View className="w-1/2 px-1.5 mb-3">
                <TouchableOpacity onPress={() => router.push("/my-applications?filter=in_progress")}>
                  <Card className="p-4">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-xl bg-purple-100 items-center justify-center">
                        <Clock color="#9333EA" size={20} />
                      </View>
                      <View className="ml-3">
                        <Text className="text-xl font-bold text-slate-900">{stats.inProgress}</Text>
                        <Text className="text-xs text-slate-600">In Progress</Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View className="w-1/2 px-1.5 mb-3">
                <TouchableOpacity onPress={() => router.push("/my-issues")}>
                  <Card className="p-4">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
                        <FileText color="#2563EB" size={20} />
                      </View>
                      <View className="ml-3">
                        <Text className="text-xl font-bold text-slate-900">{stats.postedIssues || 0}</Text>
                        <Text className="text-xs text-slate-600">Posted</Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              </View>
              <View className="w-1/2 px-1.5 mb-3">
                <TouchableOpacity onPress={() => router.push("/applicants")}>
                  <Card className="p-4">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-xl bg-amber-100 items-center justify-center">
                        <Users color="#D97706" size={20} />
                      </View>
                      <View className="ml-3">
                        <Text className="text-xl font-bold text-slate-900">{stats.interestedStudents || 0}</Text>
                        <Text className="text-xs text-slate-600">Interested</Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              </View>
              <View className="w-1/2 px-1.5 mb-3">
                <TouchableOpacity onPress={() => router.push("/my-issues?filter=completed")}>
                  <Card className="p-4">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-xl bg-green-100 items-center justify-center">
                        <CheckCircle color="#16A34A" size={20} />
                      </View>
                      <View className="ml-3">
                        <Text className="text-xl font-bold text-slate-900">{stats.issuesClosed}</Text>
                        <Text className="text-xs text-slate-600">Closed</Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              </View>
              <View className="w-1/2 px-1.5 mb-3">
                <TouchableOpacity onPress={() => router.push("/my-issues?filter=in_progress")}>
                  <Card className="p-4">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-xl bg-purple-100 items-center justify-center">
                        <Clock color="#9333EA" size={20} />
                      </View>
                      <View className="ml-3">
                        <Text className="text-xl font-bold text-slate-900">{stats.inProgress}</Text>
                        <Text className="text-xs text-slate-600">In Progress</Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Quick Actions */}
        <Text className="text-lg font-semibold text-slate-900 mb-3">Quick Actions</Text>
        <View className="space-y-3">
          {role === "student" ? (
            <TouchableOpacity onPress={() => router.push("/(tabs)/issues")}>
              <Card className="p-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-xl bg-primary/10 items-center justify-center">
                      <Search color="#2563EB" size={24} />
                    </View>
                    <View className="ml-4">
                      <Text className="text-base font-semibold text-slate-900">Browse Issues</Text>
                      <Text className="text-sm text-slate-600">Find business challenges</Text>
                    </View>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity onPress={() => router.push("/issues/new")}>
                <Card className="p-4">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="w-12 h-12 rounded-xl bg-primary/10 items-center justify-center">
                        <PlusCircle color="#2563EB" size={24} />
                      </View>
                      <View className="ml-4">
                        <Text className="text-base font-semibold text-slate-900">Post New Issue</Text>
                        <Text className="text-sm text-slate-600">Describe a challenge</Text>
                      </View>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/my-issues")}>
                <Card className="p-4">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="w-12 h-12 rounded-xl bg-emerald-100 items-center justify-center">
                        <FileText color="#059669" size={24} />
                      </View>
                      <View className="ml-4">
                        <Text className="text-base font-semibold text-slate-900">My Issues</Text>
                        <Text className="text-sm text-slate-600">Manage your posted issues</Text>
                      </View>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
