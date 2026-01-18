import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  User,
  Settings,
  LogOut,
  ChevronRight,
  GraduationCap,
  Building2,
  MapPin,
  Briefcase,
  Clock,
  Phone,
  Mail,
  Heart,
  Star,
} from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type UserRole = "student" | "business";

interface StudentProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  university_name: string;
  degree_name: string;
  degree_level: string;
  major: string;
  expertise: string[];
  areas_of_interest: string[];
  open_to_paid: boolean;
  open_to_voluntary: boolean;
  phone: string | null;
  bio: string | null;
}

interface UserData {
  role: UserRole;
  email: string | null;
}

interface BusinessProfile {
  id: string;
  owner_name: string;
  business_name: string;
  avatar_url: string | null;
  industry: string;
  address: string;
  city: string | null;
  looking_for: string[];
  business_description: string | null;
  business_age_years: number | null;
  phone: string | null;
}

export default function ProfileScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const router = useRouter();

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from("users")
        .select("role, email")
        .eq("id", user.id)
        .single();

      if (!userData) return;
      setRole(userData.role);
      setUserEmail(userData.email || user.email || null);

      if (userData.role === "student") {
        const { data } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        setStudentProfile(data);
      } else {
        const { data } = await supabase
          .from("business_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        setBusinessProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: performLogout,
      },
    ]);
  };

  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Sign out from Supabase
      await supabase.auth.signOut({ scope: 'local' });
      
      // Clear any cached data
      setStudentProfile(null);
      setBusinessProfile(null);
      setRole(null);
      
      // Navigate to login - use setTimeout to ensure state updates complete
      setTimeout(() => {
        router.replace("/(auth)/login");
      }, 100);
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, try to navigate to login
      router.replace("/(auth)/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const profile = role === "student" ? studentProfile : businessProfile;
  const avatarUrl = profile?.avatar_url;
  const displayName = role === "student" 
    ? studentProfile?.full_name 
    : businessProfile?.owner_name;

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-4">
        {/* Profile Header */}
        <Card className="p-6 items-center mb-4">
          <View className="w-24 h-24 rounded-full bg-slate-100 items-center justify-center overflow-hidden mb-4">
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                className="w-full h-full"
                style={{ width: 96, height: 96 }}
              />
            ) : role === "student" ? (
              <User color="#94A3B8" size={48} />
            ) : (
              <Building2 color="#94A3B8" size={48} />
            )}
          </View>
          <Text className="text-xl font-bold text-slate-900">
            {displayName || "User"}
          </Text>
          {role === "student" && studentProfile && (
            <View className="flex-row items-center mt-1">
              <GraduationCap color="#64748B" size={16} />
              <Text className="text-sm text-slate-600 ml-1">
                {studentProfile.university_name}
              </Text>
            </View>
          )}
          {role === "business" && businessProfile && (
            <>
              <Text className="text-base text-slate-600 mt-1">
                {businessProfile.business_name}
              </Text>
              <View className="flex-row items-center mt-1">
                <Briefcase color="#64748B" size={14} />
                <Text className="text-sm text-slate-500 ml-1">
                  {businessProfile.industry}
                </Text>
              </View>
            </>
          )}
        </Card>

        {/* Profile Details */}
        {role === "student" && studentProfile && (
          <Card className="p-4 mb-4">
            {/* Contact Info */}
            <Text className="text-sm font-semibold text-slate-900 mb-3">
              Contact Information
            </Text>
            
            {userEmail && (
              <View className="flex-row items-center mb-2">
                <Mail color="#64748B" size={16} />
                <Text className="text-slate-600 ml-2">{userEmail}</Text>
              </View>
            )}
            
            {studentProfile.phone && (
              <View className="flex-row items-center mb-2">
                <Phone color="#64748B" size={16} />
                <Text className="text-slate-600 ml-2">{studentProfile.phone}</Text>
              </View>
            )}
            
            {!userEmail && !studentProfile.phone && (
              <Text className="text-slate-400 italic text-sm mb-2">No contact info added</Text>
            )}

            {/* Education */}
            <Text className="text-sm font-semibold text-slate-900 mt-4 mb-3">
              Education
            </Text>
            <Text className="text-slate-600">
              {studentProfile.degree_name} in {studentProfile.major}
            </Text>
            {studentProfile.degree_level && (
              <Text className="text-xs text-slate-500 mt-1 capitalize">
                {studentProfile.degree_level === "undergraduate" ? "Undergraduate" :
                 studentProfile.degree_level === "masters" ? "Master's" :
                 studentProfile.degree_level === "doctorate" ? "Doctorate" :
                 studentProfile.degree_level} program
              </Text>
            )}

            {/* Areas of Interest */}
            <Text className="text-sm font-semibold text-slate-900 mt-4 mb-2">
              <Heart color="#6366F1" size={14} /> Areas of Interest
            </Text>
            {studentProfile.areas_of_interest && studentProfile.areas_of_interest.length > 0 ? (
              <View className="flex-row flex-wrap">
                {studentProfile.areas_of_interest.map((interest) => (
                  <Badge key={interest} variant="secondary" className="mr-1.5 mb-1.5">
                    {interest}
                  </Badge>
                ))}
              </View>
            ) : (
              <Text className="text-slate-400 italic text-sm">No interests added</Text>
            )}

            {/* Expertise */}
            <Text className="text-sm font-semibold text-slate-900 mt-4 mb-2">
              <Star color="#6366F1" size={14} /> Expertise
            </Text>
            {studentProfile.expertise && studentProfile.expertise.length > 0 ? (
              <View className="flex-row flex-wrap">
                {studentProfile.expertise.map((skill) => (
                  <Badge key={skill} variant="primary" className="mr-1.5 mb-1.5">
                    {skill}
                  </Badge>
                ))}
              </View>
            ) : (
              <Text className="text-slate-400 italic text-sm">No expertise added</Text>
            )}

            {/* Work Preferences */}
            <Text className="text-sm font-semibold text-slate-900 mt-4 mb-2">
              Work Preferences
            </Text>
            <View className="flex-row flex-wrap">
              {studentProfile.open_to_paid && (
                <Badge variant="success" className="mr-1.5 mb-1.5">Open to Paid</Badge>
              )}
              {studentProfile.open_to_voluntary && (
                <Badge variant="secondary" className="mr-1.5 mb-1.5">Open to Voluntary</Badge>
              )}
              {!studentProfile.open_to_paid && !studentProfile.open_to_voluntary && (
                <Text className="text-slate-400 italic text-sm">No preferences set</Text>
              )}
            </View>
          </Card>
        )}

        {role === "business" && businessProfile && (
          <Card className="p-4 mb-4">
            {/* Business Details */}
            <Text className="text-sm font-semibold text-slate-900 mb-3">
              Business Details
            </Text>
            
            {businessProfile.business_age_years !== null && businessProfile.business_age_years !== undefined && (
              <View className="flex-row items-center mb-3">
                <Clock color="#64748B" size={16} />
                <Text className="text-slate-600 ml-2">
                  {businessProfile.business_age_years} {businessProfile.business_age_years === 1 ? "year" : "years"} in business
                </Text>
              </View>
            )}
            
            <View className="flex-row items-center mb-3">
              <Briefcase color="#64748B" size={16} />
              <Text className="text-slate-600 ml-2">
                {businessProfile.industry || "Industry not specified"}
              </Text>
            </View>

            {(businessProfile.address || businessProfile.city) && (
              <View className="flex-row items-center mb-3">
                <MapPin color="#64748B" size={16} />
                <Text className="text-slate-600 ml-2">
                  {[businessProfile.address, businessProfile.city].filter(Boolean).join(", ")}
                </Text>
              </View>
            )}

            {businessProfile.phone && (
              <View className="flex-row items-center mb-3">
                <Phone color="#64748B" size={16} />
                <Text className="text-slate-600 ml-2">
                  {businessProfile.phone}
                </Text>
              </View>
            )}

            {businessProfile.business_description && (
              <>
                <Text className="text-sm font-semibold text-slate-900 mt-4 mb-2">
                  About Business
                </Text>
                <Text className="text-slate-600">
                  {businessProfile.business_description}
                </Text>
              </>
            )}

            {businessProfile.looking_for && businessProfile.looking_for.length > 0 && (
              <>
                <Text className="text-sm font-semibold text-slate-900 mt-4 mb-2">
                  Looking For Help With
                </Text>
                <View className="flex-row flex-wrap">
                  {businessProfile.looking_for.map((skill) => (
                    <Badge key={skill} variant="primary" className="mr-1.5 mb-1.5">
                      {skill}
                    </Badge>
                  ))}
                </View>
              </>
            )}
          </Card>
        )}

        {/* Actions */}
        <Card className="mb-4">
          <TouchableOpacity
            className="flex-row items-center justify-between p-4 border-b border-slate-100"
            onPress={() => router.push("/profile/edit")}
          >
            <View className="flex-row items-center">
              <Settings color="#64748B" size={20} />
              <Text className="text-slate-900 ml-3">Edit Profile</Text>
            </View>
            <ChevronRight color="#94A3B8" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between p-4 border-b border-slate-100"
            onPress={() => router.push("/settings")}
          >
            <View className="flex-row items-center">
              <Settings color="#64748B" size={20} />
              <Text className="text-slate-900 ml-3">Settings</Text>
            </View>
            <ChevronRight color="#94A3B8" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between p-4"
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <View className="flex-row items-center">
              {isLoggingOut ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <LogOut color="#EF4444" size={20} />
              )}
              <Text className="text-red-500 ml-3">
                {isLoggingOut ? "Logging out..." : "Logout"}
              </Text>
            </View>
            <ChevronRight color="#94A3B8" size={20} />
          </TouchableOpacity>
        </Card>
      </View>
    </ScrollView>
  );
}
