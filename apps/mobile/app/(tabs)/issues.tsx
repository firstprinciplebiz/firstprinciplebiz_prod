import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Search, Clock } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Issue {
  id: string;
  title: string;
  description: string;
  status: string;
  compensation_type: string;
  created_at: string;
  required_skills: string[];
  business_profiles: {
    business_name: string;
    industry: string;
    address: string;
  };
}

export default function IssuesScreen() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [appliedIssueIds, setAppliedIssueIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const fetchIssues = useCallback(async () => {
    try {
      // Fetch issues
      const { data, error } = await supabase
        .from("issues")
        .select(`
          *,
          business_profiles(business_name, industry, address)
        `)
        .in("status", ["open", "in_progress_accepting"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setIssues(data || []);

      // Check which issues user has applied to
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (userData?.role === "student") {
          const { data: profile } = await supabase
            .from("student_profiles")
            .select("id")
            .eq("user_id", user.id)
            .single();

          if (profile) {
            const { data: interests } = await supabase
              .from("issue_interests")
              .select("issue_id")
              .eq("student_id", profile.id);

            if (interests) {
              setAppliedIssueIds(new Set(interests.map(i => i.issue_id)));
            }
          }
        }
      }
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

  const filteredIssues = issues.filter(
    (issue) =>
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.business_profiles?.business_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const getCompensationLabel = (type: string) => {
    switch (type) {
      case "paid":
        return { label: "Paid", variant: "success" as const };
      case "voluntary":
        return { label: "Voluntary", variant: "secondary" as const };
      case "negotiable":
        return { label: "Negotiable", variant: "warning" as const };
      default:
        return { label: type, variant: "secondary" as const };
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
    <View className="flex-1 bg-slate-50">
      {/* Search Bar */}
      <View className="p-4 bg-white border-b border-slate-200">
        <View className="flex-row items-center bg-slate-100 rounded-xl px-4 py-3">
          <Search color="#94A3B8" size={20} />
          <TextInput
            className="flex-1 ml-3 text-base text-slate-900"
            placeholder="Search issues..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-4">
          <Text className="text-sm text-slate-600 mb-3">
            {filteredIssues.length} issue{filteredIssues.length !== 1 ? "s" : ""} found
          </Text>

          {filteredIssues.length === 0 ? (
            <Card className="p-8 items-center">
              <Text className="text-lg font-semibold text-slate-900 mb-2">
                No issues found
              </Text>
              <Text className="text-slate-600 text-center">
                Try adjusting your search or check back later.
              </Text>
            </Card>
          ) : (
            <View className="space-y-3">
              {filteredIssues.map((issue) => {
                const compensation = getCompensationLabel(issue.compensation_type);
                const hasApplied = appliedIssueIds.has(issue.id);
                return (
                  <TouchableOpacity
                    key={issue.id}
                    onPress={() => router.push(`/issues/${issue.id}`)}
                  >
                    <Card className="p-4">
                      <View className="flex-row items-start justify-between mb-2">
                        <Text className="flex-1 text-base font-semibold text-slate-900 mr-2">
                          {issue.title}
                        </Text>
                        <View className="flex-row">
                          {hasApplied && (
                            <Badge variant="primary" className="mr-1">
                              Applied
                            </Badge>
                          )}
                          <Badge variant={compensation.variant}>
                            {compensation.label}
                          </Badge>
                        </View>
                      </View>

                      <Text className="text-sm text-slate-600 mb-3" numberOfLines={2}>
                        {issue.description}
                      </Text>

                      <View className="flex-row items-center flex-wrap">
                        <View className="flex-row items-center mr-4 mb-1">
                          <Text className="text-xs text-slate-500">
                            {issue.business_profiles?.business_name}
                          </Text>
                        </View>
                        {issue.business_profiles?.industry && (
                          <View className="flex-row items-center mr-4 mb-1">
                            <Text className="text-xs text-slate-400">
                              {issue.business_profiles.industry}
                            </Text>
                          </View>
                        )}
                        <View className="flex-row items-center mb-1">
                          <Clock color="#94A3B8" size={12} />
                          <Text className="text-xs text-slate-400 ml-1">
                            {new Date(issue.created_at).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>

                      {issue.required_skills && issue.required_skills.length > 0 && (
                        <View className="flex-row flex-wrap mt-2 -mb-1">
                          {issue.required_skills.slice(0, 3).map((skill: string) => (
                            <View
                              key={skill}
                              className="bg-primary/10 px-2 py-0.5 rounded mr-1.5 mb-1"
                            >
                              <Text className="text-xs text-primary">{skill}</Text>
                            </View>
                          ))}
                          {issue.required_skills.length > 3 && (
                            <Text className="text-xs text-slate-400 mb-1">
                              +{issue.required_skills.length - 3} more
                            </Text>
                          )}
                        </View>
                      )}
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
