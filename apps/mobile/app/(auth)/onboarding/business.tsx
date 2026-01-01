import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select, MultiSelect } from "@/components/ui/Select";
import { INDUSTRIES, EXPERTISE_AREAS } from "@/constants";

export default function BusinessOnboardingScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    owner_name: "",
    business_name: "",
    industry: "",
    business_age_years: "",
    phone: "",
    address: "",
    business_description: "",
    looking_for: [] as string[],
  });
  const router = useRouter();

  const industryOptions = INDUSTRIES.map((i) => ({ value: i, label: i }));
  const expertiseOptions = EXPERTISE_AREAS.map((e) => ({ value: e, label: e }));

  const handleSubmit = async () => {
    if (!formData.owner_name || !formData.business_name || !formData.industry) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create business profile
      const { error: profileError } = await supabase
        .from("business_profiles")
        .insert({
          user_id: user.id,
          owner_name: formData.owner_name,
          business_name: formData.business_name,
          industry: formData.industry,
          business_age_years: formData.business_age_years ? parseInt(formData.business_age_years) : null,
          phone: formData.phone || null,
          address: formData.address || null,
          business_description: formData.business_description || null,
          looking_for: formData.looking_for,
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
          Tell us about your business so students can learn more about you.
        </Text>

        <View className="space-y-4">
          <Input
            label="Your Name *"
            placeholder="Enter your full name"
            value={formData.owner_name}
            onChangeText={(text) => setFormData({ ...formData, owner_name: text })}
          />

          <Input
            label="Business Name *"
            placeholder="Enter your business name"
            value={formData.business_name}
            onChangeText={(text) => setFormData({ ...formData, business_name: text })}
          />

          {/* Industry Dropdown */}
          <Select
            label="Industry *"
            value={formData.industry}
            options={industryOptions}
            onValueChange={(value) =>
              setFormData({ ...formData, industry: value })
            }
            placeholder="Select your industry..."
          />

          <Input
            label="Years in Business"
            placeholder="e.g., 5"
            value={formData.business_age_years}
            onChangeText={(text) =>
              setFormData({ ...formData, business_age_years: text.replace(/[^0-9]/g, '') })
            }
            keyboardType="numeric"
          />

          <Input
            label="Phone"
            placeholder="+1 (555) 123-4567"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
          />

          <Input
            label="Address (Optional)"
            placeholder="Enter your business address"
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
          />

          <Input
            label="Business Description (Optional)"
            placeholder="Tell us about your business..."
            value={formData.business_description}
            onChangeText={(text) => setFormData({ ...formData, business_description: text })}
            multiline
            numberOfLines={4}
            style={{ height: 100, textAlignVertical: "top" }}
          />

          {/* Looking for Help With */}
          <MultiSelect
            label="Looking for Help With"
            value={formData.looking_for}
            options={expertiseOptions}
            onValueChange={(value) =>
              setFormData({ ...formData, looking_for: value })
            }
            placeholder="Select areas where you need help..."
            maxSelections={10}
          />

          <Button onPress={handleSubmit} isLoading={isLoading} className="mt-4">
            Complete Profile
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
