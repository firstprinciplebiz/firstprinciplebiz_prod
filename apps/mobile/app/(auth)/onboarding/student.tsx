import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { MultiSelect } from "@/components/ui/Select";
import { EXPERTISE_AREAS } from "@/constants";

const DEGREE_LEVELS = [
  { value: "undergraduate", label: "Undergraduate" },
  { value: "masters", label: "Masters" },
  { value: "doctorate", label: "Doctorate" },
  { value: "other", label: "Other" },
];

export default function StudentOnboardingScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    university_name: "",
    degree_name: "",
    major: "",
    degree_level: "undergraduate",
    bio: "",
    areas_of_interest: [] as string[],
    expertise: [] as string[],
    open_to_paid: true,
    open_to_voluntary: true,
  });
  const router = useRouter();

  const expertiseOptions = EXPERTISE_AREAS.map((e) => ({ value: e, label: e }));

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.university_name || !formData.degree_name || !formData.major) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create student profile
      const { error: profileError } = await supabase
        .from("student_profiles")
        .insert({
          user_id: user.id,
          full_name: formData.full_name,
          phone: formData.phone || null,
          university_name: formData.university_name,
          degree_name: formData.degree_name,
          major: formData.major,
          degree_level: formData.degree_level,
          bio: formData.bio || null,
          areas_of_interest: formData.areas_of_interest,
          expertise: formData.expertise,
          open_to_paid: formData.open_to_paid,
          open_to_voluntary: formData.open_to_voluntary,
        });

      if (profileError) throw profileError;

      // Update user profile_completed flag
      const { error: userError } = await supabase
        .from("users")
        .update({ profile_completed: true })
        .eq("id", user.id);

      if (userError) throw userError;

      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-2xl font-bold text-slate-900 mb-2">
          Complete Your Profile
        </Text>
        <Text className="text-slate-600 mb-6">
          Tell us about yourself so businesses can learn more about you.
        </Text>

        <View className="space-y-4">
          <Input
            label="Full Name *"
            placeholder="Enter your full name"
            value={formData.full_name}
            onChangeText={(text) => setFormData({ ...formData, full_name: text })}
          />

          <Input
            label="Phone (Optional)"
            placeholder="+1 (555) 123-4567"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
          />

          <Input
            label="University Name *"
            placeholder="Enter your university"
            value={formData.university_name}
            onChangeText={(text) => setFormData({ ...formData, university_name: text })}
          />

          <Input
            label="Degree Name *"
            placeholder="e.g., Bachelor of Business Administration"
            value={formData.degree_name}
            onChangeText={(text) => setFormData({ ...formData, degree_name: text })}
          />

          <Input
            label="Major *"
            placeholder="e.g., Marketing"
            value={formData.major}
            onChangeText={(text) => setFormData({ ...formData, major: text })}
          />

          <View>
            <Text className="text-sm font-medium text-slate-700 mb-2">
              Degree Level *
            </Text>
            <View className="flex-row flex-wrap -mx-1">
              {DEGREE_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  className={`mx-1 mb-2 px-4 py-2 rounded-lg border ${
                    formData.degree_level === level.value
                      ? "border-primary bg-primary/5"
                      : "border-slate-200"
                  }`}
                  onPress={() => setFormData({ ...formData, degree_level: level.value })}
                >
                  <Text
                    className={
                      formData.degree_level === level.value
                        ? "text-primary font-medium"
                        : "text-slate-600"
                    }
                  >
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Input
            label="Bio (Optional)"
            placeholder="Tell us about yourself..."
            value={formData.bio}
            onChangeText={(text) => setFormData({ ...formData, bio: text })}
            multiline
            numberOfLines={4}
            style={{ height: 100, textAlignVertical: "top" }}
          />

          {/* Areas of Interest */}
          <MultiSelect
            label="Areas of Interest"
            value={formData.areas_of_interest}
            options={expertiseOptions}
            onValueChange={(value) =>
              setFormData({ ...formData, areas_of_interest: value })
            }
            placeholder="Select areas you're interested in..."
            maxSelections={10}
          />

          {/* Expertise */}
          <MultiSelect
            label="Your Expertise"
            value={formData.expertise}
            options={expertiseOptions}
            onValueChange={(value) =>
              setFormData({ ...formData, expertise: value })
            }
            placeholder="Select your skills..."
            maxSelections={10}
          />

          {/* Work Preferences */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-slate-700 mb-3">
              Work Preferences
            </Text>
            
            <TouchableOpacity
              className={`flex-row items-center p-3 rounded-xl border mb-2 ${
                formData.open_to_paid
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 bg-white"
              }`}
              onPress={() =>
                setFormData({ ...formData, open_to_paid: !formData.open_to_paid })
              }
            >
              <View
                className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
                  formData.open_to_paid
                    ? "border-emerald-500 bg-emerald-500"
                    : "border-slate-300"
                }`}
              >
                {formData.open_to_paid && (
                  <Text className="text-white text-xs font-bold">✓</Text>
                )}
              </View>
              <View>
                <Text className="text-slate-900 font-medium">Open to Paid Work</Text>
                <Text className="text-slate-500 text-xs">I'm interested in paid opportunities</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              className={`flex-row items-center p-3 rounded-xl border ${
                formData.open_to_voluntary
                  ? "border-primary bg-primary/5"
                  : "border-slate-200 bg-white"
              }`}
              onPress={() =>
                setFormData({ ...formData, open_to_voluntary: !formData.open_to_voluntary })
              }
            >
              <View
                className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
                  formData.open_to_voluntary
                    ? "border-primary bg-primary"
                    : "border-slate-300"
                }`}
              >
                {formData.open_to_voluntary && (
                  <Text className="text-white text-xs font-bold">✓</Text>
                )}
              </View>
              <View>
                <Text className="text-slate-900 font-medium">Open to Voluntary Work</Text>
                <Text className="text-slate-500 text-xs">I'm interested in volunteer/unpaid opportunities</Text>
              </View>
            </TouchableOpacity>
          </View>

          <Button onPress={handleSubmit} isLoading={isLoading} className="mt-4">
            Complete Profile
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
