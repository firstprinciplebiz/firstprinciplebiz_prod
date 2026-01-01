import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { User, GraduationCap, BookOpen, Briefcase } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface StudentProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  university_name: string;
  degree_name: string;
  degree_level: string;
  major: string;
  bio: string | null;
  expertise: string[];
  areas_of_interest: string[];
  open_to_paid: boolean;
  open_to_voluntary: boolean;
}

export default function StudentProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Try by profile ID first
        let { data, error } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("id", id)
          .single();

        if (!data) {
          // Try by user ID
          const result = await supabase
            .from("student_profiles")
            .select("*")
            .eq("user_id", id)
            .single();
          data = result.data;
        }

        setProfile(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchProfile();
  }, [id]);

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
      <Stack.Screen options={{ title: profile.full_name || "Student Profile" }} />
      <ScrollView className="flex-1 bg-slate-50">
        <View className="p-4">
          {/* Header */}
          <Card className="p-6 items-center mb-4">
            <View className="w-24 h-24 rounded-full bg-slate-100 items-center justify-center overflow-hidden mb-4">
              {profile.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  className="w-full h-full"
                />
              ) : (
                <User color="#94A3B8" size={48} />
              )}
            </View>
            <Text className="text-xl font-bold text-slate-900">
              {profile.full_name}
            </Text>
            <View className="flex-row items-center mt-1">
              <GraduationCap color="#64748B" size={16} />
              <Text className="text-sm text-slate-600 ml-1">
                {profile.university_name}
              </Text>
            </View>
            <View className="flex-row items-center mt-1">
              <BookOpen color="#64748B" size={14} />
              <Text className="text-sm text-slate-500 ml-1">
                {profile.degree_name} • {profile.major}
              </Text>
            </View>
            {profile.degree_level && (
              <Text className="text-xs text-slate-400 mt-1 capitalize">
                {profile.degree_level} program
              </Text>
            )}
          </Card>

          {/* Bio */}
          <Card className="p-4 mb-4">
            <Text className="font-semibold text-slate-900 mb-2">About</Text>
            <Text className="text-slate-600">
              {profile.bio || "No bio provided"}
            </Text>
          </Card>

          {/* Expertise */}
          {profile.expertise && profile.expertise.length > 0 && (
            <Card className="p-4 mb-4">
              <Text className="font-semibold text-slate-900 mb-3">Expertise</Text>
              <View className="flex-row flex-wrap">
                {profile.expertise.map((skill) => (
                  <Badge key={skill} variant="primary" className="mr-1.5 mb-1.5">
                    {skill}
                  </Badge>
                ))}
              </View>
            </Card>
          )}

          {/* Areas of Interest */}
          {profile.areas_of_interest && profile.areas_of_interest.length > 0 && (
            <Card className="p-4 mb-4">
              <Text className="font-semibold text-slate-900 mb-3">
                Areas of Interest
              </Text>
              <View className="flex-row flex-wrap">
                {profile.areas_of_interest.map((interest) => (
                  <Badge key={interest} variant="primary" className="mr-1.5 mb-1.5">
                    {interest}
                  </Badge>
                ))}
              </View>
            </Card>
          )}

          {/* Work Preferences */}
          <Card className="p-4 mb-4">
            <Text className="font-semibold text-slate-900 mb-3">
              Work Preferences
            </Text>
            <View className="flex-row items-center space-x-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-lg bg-green-100 items-center justify-center">
                  <Briefcase color="#16A34A" size={20} />
                </View>
                <View className="ml-2">
                  <Text className="text-xs text-slate-500">Paid Work</Text>
                  <Text className="font-medium text-slate-900">
                    {profile.open_to_paid ? "Yes" : "No"}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-lg bg-blue-100 items-center justify-center">
                  <Briefcase color="#2563EB" size={20} />
                </View>
                <View className="ml-2">
                  <Text className="text-xs text-slate-500">Voluntary</Text>
                  <Text className="font-medium text-slate-900">
                    {profile.open_to_voluntary ? "Yes" : "No"}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </>
  );
}


