import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { GraduationCap, Building2 } from "lucide-react-native";

type Role = "student" | "business";

export default function SelectRoleScreen() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleContinue = async () => {
    if (!selectedRole) {
      Alert.alert("Error", "Please select your role");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create or update user record with selected role
      const { error } = await supabase.from("users").upsert({
        id: user.id,
        email: user.email,
        role: selectedRole,
        profile_completed: false,
      });

      if (error) throw error;

      // Navigate to appropriate onboarding
      router.replace(`/(auth)/onboarding/${selectedRole}`);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save role");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white justify-center px-6">
      <View className="mb-8">
        <Text className="text-3xl font-bold text-slate-900 text-center">
          Welcome!
        </Text>
        <Text className="text-base text-slate-600 text-center mt-2">
          How would you like to use FirstPrincipleBiz?
        </Text>
      </View>

      <View className="space-y-4 mb-8">
        {/* Student Option */}
        <TouchableOpacity
          className={`p-5 rounded-2xl border-2 ${
            selectedRole === "student"
              ? "border-primary bg-primary/5"
              : "border-slate-200 bg-white"
          }`}
          onPress={() => setSelectedRole("student")}
        >
          <View className="flex-row items-center">
            <View
              className={`w-14 h-14 rounded-xl items-center justify-center ${
                selectedRole === "student" ? "bg-primary" : "bg-indigo-100"
              }`}
            >
              <GraduationCap
                color={selectedRole === "student" ? "#FFFFFF" : "#6366F1"}
                size={28}
              />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-lg font-semibold text-slate-900">
                I'm a Student
              </Text>
              <Text className="text-slate-600 text-sm mt-1">
                Browse challenges, apply skills, gain experience
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Business Option */}
        <TouchableOpacity
          className={`p-5 rounded-2xl border-2 ${
            selectedRole === "business"
              ? "border-emerald-500 bg-emerald-50"
              : "border-slate-200 bg-white"
          }`}
          onPress={() => setSelectedRole("business")}
        >
          <View className="flex-row items-center">
            <View
              className={`w-14 h-14 rounded-xl items-center justify-center ${
                selectedRole === "business" ? "bg-emerald-500" : "bg-emerald-100"
              }`}
            >
              <Building2
                color={selectedRole === "business" ? "#FFFFFF" : "#10B981"}
                size={28}
              />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-lg font-semibold text-slate-900">
                I'm a Business Owner
              </Text>
              <Text className="text-slate-600 text-sm mt-1">
                Post challenges, connect with talented students
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className={`w-full py-4 rounded-xl ${
          isLoading || !selectedRole ? "bg-primary/50" : "bg-primary"
        }`}
        onPress={handleContinue}
        disabled={isLoading || !selectedRole}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center font-semibold text-base">
            Continue
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}



