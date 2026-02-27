import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const COMPENSATION_TYPES = [
  { value: "paid", label: "Paid" },
  { value: "voluntary", label: "Voluntary" },
  { value: "negotiable", label: "Negotiable" },
];

export default function NewIssueScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    expectations: "",
    compensation_type: "negotiable",
    compensation_amount: "",
    duration_days: "",
  });
  const router = useRouter();

  const handleSubmit = async () => {
    if (!formData.title || formData.title.trim().length < 10) {
      Alert.alert("Error", "Title must be at least 10 characters");
      return;
    }
    if (formData.title.trim().length > 64) {
      Alert.alert("Error", "Title must be at most 64 characters");
      return;
    }
    if (!formData.description || formData.description.trim().length < 50) {
      Alert.alert("Error", "Description must be at least 50 characters");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("business_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) throw new Error("Business profile not found");

      const { error } = await supabase.from("issues").insert({
        business_id: profile.id,
        title: formData.title,
        description: formData.description,
        expectations: formData.expectations || null,
        compensation_type: formData.compensation_type,
        compensation_amount: formData.compensation_amount
          ? parseFloat(formData.compensation_amount)
          : null,
        duration_days: formData.duration_days
          ? parseInt(formData.duration_days)
          : null,
        status: "open",
      });

      if (error) throw error;

      Alert.alert("Success", "Issue posted successfully!");
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to post issue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Post New Issue" }} />
      <ScrollView className="flex-1 bg-slate-50">
        <View className="p-4">
          <Card className="p-4 mb-4">
            <View className="space-y-4">
              <View>
                <Input
                  label="Title * (10-64 characters)"
                  placeholder="Enter a clear, descriptive title"
                  value={formData.title}
                  onChangeText={(text) =>
                    setFormData({ ...formData, title: text.slice(0, 64) })
                  }
                  maxLength={64}
                />
                <Text className={`text-xs mt-1 ${formData.title.length > 64 ? 'text-red-500' : 'text-slate-500'}`}>
                  {formData.title.length}/64 characters
                </Text>
              </View>

              <Input
                label="Description *"
                placeholder="Describe the issue in detail..."
                value={formData.description}
                onChangeText={(text) =>
                  setFormData({ ...formData, description: text })
                }
                multiline
                numberOfLines={6}
                style={{ height: 150, textAlignVertical: "top" }}
              />

              <Input
                label="Expectations (Optional)"
                placeholder="What do you expect from the student?"
                value={formData.expectations}
                onChangeText={(text) =>
                  setFormData({ ...formData, expectations: text })
                }
                multiline
                numberOfLines={3}
                style={{ height: 80, textAlignVertical: "top" }}
              />
            </View>
          </Card>

          <Card className="p-4 mb-4">
            <Text className="font-semibold text-slate-900 mb-3">
              Compensation
            </Text>
            <View className="flex-row flex-wrap -mx-1 mb-4">
              {COMPENSATION_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  className={`mx-1 mb-2 px-4 py-2 rounded-lg border ${
                    formData.compensation_type === type.value
                      ? "border-primary bg-primary/5"
                      : "border-slate-200"
                  }`}
                  onPress={() =>
                    setFormData({ ...formData, compensation_type: type.value })
                  }
                >
                  <Text
                    className={
                      formData.compensation_type === type.value
                        ? "text-primary font-medium"
                        : "text-slate-600"
                    }
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {formData.compensation_type === "paid" && (
              <Input
                label="Amount ($)"
                placeholder="Enter amount"
                value={formData.compensation_amount}
                onChangeText={(text) =>
                  setFormData({ ...formData, compensation_amount: text })
                }
                keyboardType="numeric"
              />
            )}
          </Card>

          <Card className="p-4 mb-4">
            <Text className="font-semibold text-slate-900 mb-3">Details</Text>
            <Input
              label="Duration (days)"
              placeholder="Estimated duration"
              value={formData.duration_days}
              onChangeText={(text) =>
                setFormData({ ...formData, duration_days: text })
              }
              keyboardType="numeric"
            />
          </Card>

          <Button onPress={handleSubmit} isLoading={isLoading}>
            Post Issue
          </Button>
        </View>
      </ScrollView>
    </>
  );
}
