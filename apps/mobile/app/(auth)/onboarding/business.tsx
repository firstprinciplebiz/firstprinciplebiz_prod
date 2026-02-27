import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PhoneInput, isValidPhoneNumber } from "@/components/ui/PhoneInput";
import { Select, MultiSelect } from "@/components/ui/Select";
import { INDUSTRIES, EXPERTISE_AREAS } from "@/constants";
import { Camera, Gift, MapPin } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";

export default function BusinessOnboardingScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    owner_name: "",
    business_name: "",
    industry: "",
    business_age_years: "",
    phone: "",
    address: "",
    city: "",
    business_description: "",
    looking_for: [] as string[],
    referral_code: "",
  });
  const router = useRouter();

  const industryOptions = INDUSTRIES.map((i) => ({ value: i, label: i }));
  const expertiseOptions = EXPERTISE_AREAS.map((e) => ({ value: e, label: e }));

  // Validate step 1
  const validateStep1 = (): boolean => {
    setStepError(null);
    
    if (!formData.owner_name || formData.owner_name.trim().length < 2) {
      setStepError("Owner name is required (minimum 2 characters)");
      return false;
    }
    
    if (!formData.phone || !isValidPhoneNumber(formData.phone)) {
      setStepError("Phone number is required (exactly 10 digits)");
      return false;
    }
    
    if (!formData.business_name || formData.business_name.trim().length < 2) {
      setStepError("Business name is required");
      return false;
    }
    
    if (!formData.industry) {
      setStepError("Industry is required");
      return false;
    }
    
    const businessAge = parseInt(formData.business_age_years);
    if (isNaN(businessAge) || businessAge < 0) {
      setStepError("Business age is required");
      return false;
    }
    
    if (!formData.address || formData.address.trim().length < 5) {
      setStepError("Business address is required (minimum 5 characters)");
      return false;
    }
    
    if (!formData.city || formData.city.trim().length < 2) {
      setStepError("City is required");
      return false;
    }
    
    return true;
  };

  // Validate step 2
  const validateStep2 = (): boolean => {
    setStepError(null);
    
    if (!formData.business_description || formData.business_description.trim().length < 25) {
      setStepError("Business description is required (minimum 25 characters)");
      return false;
    }
    
    if (!formData.looking_for || formData.looking_for.length === 0) {
      setStepError("Please select at least one type of help you're looking for");
      return false;
    }
    
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && !validateStep1()) return;
    setStepError(null);
    setStep(2);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    setIsUploadingAvatar(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Determine file extension and mime type
      const ext = uri.split(".").pop()?.toLowerCase() || "jpg";
      const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      const fileName = `${user.id}/${Date.now()}.${ext}`;

      // Convert base64 to ArrayBuffer
      const arrayBuffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, arrayBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      setAvatarUrl(urlData.publicUrl);
    } catch (error: any) {
      console.error("Upload error:", error);
      Alert.alert("Error", error.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate referral code
      const { data: refCodeData } = await supabase.rpc("generate_referral_code");
      const newReferralCode = refCodeData || user.id.slice(0, 6).toUpperCase();

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
          city: formData.city || null,
          business_description: formData.business_description || null,
          looking_for: formData.looking_for,
          avatar_url: avatarUrl,
          referral_code: newReferralCode,
          referred_by_code: formData.referral_code || null,
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
          Complete Your Business Profile
        </Text>
        <Text className="text-slate-600 mb-4">
          Step {step} of 2
        </Text>

        {/* Progress Bar */}
        <View className="flex-row mb-6">
          {[1, 2].map((s) => (
            <View
              key={s}
              className={`flex-1 h-2 rounded-full mx-1 ${
                s <= step ? "bg-emerald-500" : "bg-slate-200"
              }`}
            />
          ))}
        </View>

        {/* Error Message */}
        {stepError && (
          <View className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <Text className="text-amber-700">{stepError}</Text>
          </View>
        )}

        {/* Step 1: Owner & Business Info */}
        {step === 1 && (
          <View className="space-y-4">
            <Input
              label="Owner Name *"
              placeholder="Enter your full name"
              value={formData.owner_name}
              onChangeText={(text) => setFormData({ ...formData, owner_name: text })}
            />

            <PhoneInput
              label="Phone Number *"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
            />

            <Input
              label="Business Name *"
              placeholder="Enter your business name"
              value={formData.business_name}
              onChangeText={(text) => setFormData({ ...formData, business_name: text })}
            />

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
              label="Years in Business *"
              placeholder="e.g., 5"
              value={formData.business_age_years}
              onChangeText={(text) =>
                setFormData({ ...formData, business_age_years: text.replace(/[^0-9]/g, "") })
              }
              keyboardType="numeric"
            />

            <Input
              label="Business Address *"
              placeholder="Enter your business address"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
            />

            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <MapPin color="#64748B" size={16} />
                <Text className="text-sm font-medium text-slate-700 ml-2">
                  City *
                </Text>
              </View>
              <Input
                placeholder="e.g., New York"
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
              />
            </View>

            {/* Referral Code */}
            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <Gift color="#64748B" size={16} />
                <Text className="text-sm font-medium text-slate-700 ml-2">
                  Referral Code (Optional)
                </Text>
              </View>
              <Input
                placeholder="Enter referral code (e.g., A3B7X9)"
                value={formData.referral_code}
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    referral_code: text.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                  })
                }
                maxLength={6}
              />
            </View>

            <Button onPress={handleNextStep} className="mt-4">
              Next Step
            </Button>
          </View>
        )}

        {/* Step 2: Description & Needs */}
        {step === 2 && (
          <View className="space-y-4">
            {/* Avatar Upload */}
            <View className="items-center mb-6">
              <Text className="text-sm font-medium text-slate-700 mb-3">
                Business Logo (Optional)
              </Text>
              <TouchableOpacity
                onPress={handlePickImage}
                disabled={isUploadingAvatar}
                className="relative"
              >
                <View className="w-24 h-24 rounded-full bg-slate-100 items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                  {avatarUrl ? (
                    <Image
                      source={{ uri: avatarUrl }}
                      className="w-full h-full"
                      style={{ width: 96, height: 96 }}
                    />
                  ) : (
                    <Camera color="#94A3B8" size={32} />
                  )}
                </View>
                <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-emerald-500 items-center justify-center">
                  <Camera color="white" size={16} />
                </View>
              </TouchableOpacity>
              {isUploadingAvatar && (
                <Text className="text-sm text-slate-500 mt-2">Uploading...</Text>
              )}
            </View>

            <View>
              <Text className="text-sm font-medium text-slate-700 mb-2">
                Business Description * (Min 25 characters)
              </Text>
              <Input
                placeholder="Tell us about your business..."
                value={formData.business_description}
                onChangeText={(text) => setFormData({ ...formData, business_description: text })}
                multiline
                numberOfLines={4}
                style={{ height: 100, textAlignVertical: "top" }}
              />
              <Text className="text-xs text-slate-500 mt-1">
                {formData.business_description.length}/25 characters minimum
              </Text>
            </View>

            <MultiSelect
              label="Looking for Help With * (At least one)"
              value={formData.looking_for}
              options={expertiseOptions}
              onValueChange={(value) =>
                setFormData({ ...formData, looking_for: value })
              }
              placeholder="Select areas where you need help..."
              maxSelections={10}
            />

            <View className="flex-row justify-between mt-4">
              <Button variant="outline" onPress={() => setStep(1)} className="flex-1 mr-2">
                Previous
              </Button>
              <Button onPress={handleSubmit} isLoading={isLoading} className="flex-1 ml-2">
                Complete Profile
              </Button>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
