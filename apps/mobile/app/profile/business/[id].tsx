import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import {
  Building2,
  MapPin,
  Briefcase,
  Calendar,
  ChevronRight,
} from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface BusinessProfile {
  id: string;
  owner_name: string;
  business_name: string;
  avatar_url: string | null;
  industry: string;
  business_age: number | null;
  address: string | null;
  business_description: string | null;
  looking_for: string[];
}

interface Issue {
  id: string;
  title: string;
  status: string;
  compensation_type: string;
  created_at: string;
}

export default function BusinessProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try by profile ID first
        let { data: profileData } = await supabase
          .from("business_profiles")
          .select("*")
          .eq("id", id)
          .single();

        if (!profileData) {
          // Try by user ID
          const result = await supabase
            .from("business_profiles")
            .select("*")
            .eq("user_id", id)
            .single();
          profileData = result.data;
        }

        setProfile(profileData);

        // Fetch issues for this business
        if (profileData) {
          const { data: issuesData } = await supabase
            .from("issues")
            .select("id, title, status, compensation_type, created_at")
            .eq("business_id", profileData.id)
            .order("created_at", { ascending: false });
          setIssues(issuesData || []);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="success">Open</Badge>;
      case "in_progress_accepting":
      case "in_progress_full":
        return <Badge variant="primary">In Progress</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      case "closed":
        return <Badge variant="secondary">Closed</Badge>;
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

  if (!profile) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center p-4">
        <Text className="text-lg text-slate-600">Profile not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: profile.business_name || "Business Profile" }} />
      <ScrollView className="flex-1 bg-slate-50">
        <View className="p-4">
          {/* Header */}
          <Card className="p-6 items-center mb-4">
            <View className="w-24 h-24 rounded-xl bg-slate-100 items-center justify-center overflow-hidden mb-4">
              {profile.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  className="w-full h-full"
                />
              ) : (
                <Building2 color="#94A3B8" size={48} />
              )}
            </View>
            <Text className="text-xl font-bold text-slate-900">
              {profile.business_name}
            </Text>
            <Text className="text-slate-600 mt-1">
              Owner: {profile.owner_name}
            </Text>
            <View className="flex-row items-center mt-2">
              <Briefcase color="#64748B" size={14} />
              <Text className="text-sm text-slate-500 ml-1">
                {profile.industry}
              </Text>
            </View>
          </Card>

          {/* Details */}
          <Card className="p-4 mb-4">
            <Text className="font-semibold text-slate-900 mb-3">
              Business Details
            </Text>
            {profile.address && (
              <View className="flex-row items-center mb-2">
                <MapPin color="#64748B" size={16} />
                <Text className="text-slate-600 ml-2">{profile.address}</Text>
              </View>
            )}
            {profile.business_age && (
              <View className="flex-row items-center">
                <Calendar color="#64748B" size={16} />
                <Text className="text-slate-600 ml-2">
                  {profile.business_age} year{profile.business_age !== 1 ? "s" : ""} old
                </Text>
              </View>
            )}
          </Card>

          {/* Description */}
          {profile.business_description && (
            <Card className="p-4 mb-4">
              <Text className="font-semibold text-slate-900 mb-2">
                About the Business
              </Text>
              <Text className="text-slate-600">{profile.business_description}</Text>
            </Card>
          )}

          {/* Looking For */}
          {profile.looking_for && profile.looking_for.length > 0 && (
            <Card className="p-4 mb-4">
              <Text className="font-semibold text-slate-900 mb-3">
                Looking For
              </Text>
              <View className="flex-row flex-wrap">
                {profile.looking_for.map((skill) => (
                  <Badge key={skill} variant="primary" className="mr-1.5 mb-1.5">
                    {skill}
                  </Badge>
                ))}
              </View>
            </Card>
          )}

          {/* Posted Issues */}
          {issues.length > 0 && (
            <Card className="p-4 mb-4">
              <Text className="font-semibold text-slate-900 mb-3">
                Posted Issues ({issues.length})
              </Text>
              <View className="space-y-2">
                {issues.map((issue) => (
                  <TouchableOpacity
                    key={issue.id}
                    className="flex-row items-center justify-between p-3 bg-slate-50 rounded-lg"
                    onPress={() => router.push(`/issues/${issue.id}`)}
                  >
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="font-medium text-slate-900 flex-1 mr-2">
                          {issue.title}
                        </Text>
                        {getStatusBadge(issue.status)}
                      </View>
                      <Text className="text-xs text-slate-500 mt-1">
                        {new Date(issue.created_at).toLocaleDateString()} •{" "}
                        {issue.compensation_type}
                      </Text>
                    </View>
                    <ChevronRight color="#94A3B8" size={20} />
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </>
  );
}



