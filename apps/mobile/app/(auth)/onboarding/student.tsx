import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PhoneInput, isValidPhoneNumber } from "@/components/ui/PhoneInput";
import { MultiSelect } from "@/components/ui/Select";
import { EXPERTISE_AREAS } from "@/constants";
import { Camera, Gift } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";

const DEGREE_LEVELS = [
  { value: "undergraduate", label: "Undergraduate" },
  { value: "masters", label: "Masters" },
  { value: "doctorate", label: "Doctorate" },
  { value: "other", label: "Other" },
];

export default function StudentOnboardingScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    date_of_birth: null as Date | null,
    university_name: "",
    degree_name: "",
    major: "",
    degree_level: "undergraduate",
    bio: "",
    areas_of_interest: [] as string[],
    expertise: [] as string[],
    open_to_paid: true,
    open_to_voluntary: true,
    referral_code: "",
  });
  const router = useRouter();

  const expertiseOptions = EXPERTISE_AREAS.map((e) => ({ value: e, label: e }));

  // Calculate age from date of birth
  const calculateAge = (dob: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  // Get max date for 18+ requirement
  const getMaxDate = (): Date => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date;
  };

  // Validate step 1
  const validateStep1 = (): boolean => {
    setStepError(null);
    
    if (!formData.full_name || formData.full_name.trim().length < 2) {
      setStepError("Full name is required (minimum 2 characters)");
      return false;
    }
    
    if (!formData.phone || !isValidPhoneNumber(formData.phone)) {
      setStepError("Phone number is required (exactly 10 digits)");
      return false;
    }
    
    if (!formData.date_of_birth) {
      setStepError("Date of birth is required");
      return false;
    }
    
    const age = calculateAge(formData.date_of_birth);
    if (age < 18) {
      setStepError("You must be at least 18 years old");
      return false;
    }
    
    return true;
  };

  // Validate step 2
  const validateStep2 = (): boolean => {
    setStepError(null);
    
    if (!formData.university_name || formData.university_name.trim().length < 2) {
      setStepError("University name is required");
      return false;
    }
    
    if (!formData.degree_name || formData.degree_name.trim().length < 2) {
      setStepError("Degree name is required");
      return false;
    }
    
    if (!formData.major || formData.major.trim().length < 2) {
      setStepError("Major is required");
      return false;
    }
    
    if (!formData.bio || formData.bio.trim().length < 25) {
      setStepError("Bio is required (minimum 25 characters)");
      return false;
    }
    
    return true;
  };

  // Validate step 3
  const validateStep3 = (): boolean => {
    setStepError(null);
    
    if (!formData.areas_of_interest || formData.areas_of_interest.length === 0) {
      setStepError("Please select at least one area of interest");
      return false;
    }
    
    if (!formData.expertise || formData.expertise.length === 0) {
      setStepError("Please select at least one expertise");
      return false;
    }
    
    if (!formData.open_to_paid && !formData.open_to_voluntary) {
      setStepError("Please select at least one work preference");
      return false;
    }
    
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStepError(null);
    setStep(step + 1);
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

      const ext = uri.split(".").pop() || "jpg";
      const fileName = `${user.id}/${Date.now()}.${ext}`;

      const response = await fetch(uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, blob, { contentType: `image/${ext}`, upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      setAvatarUrl(urlData.publicUrl);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to upload image");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate referral code
      const { data: refCodeData } = await supabase.rpc("generate_referral_code");
      const newReferralCode = refCodeData || user.id.slice(0, 6).toUpperCase();

      // Create student profile
      const { error: profileError } = await supabase
        .from("student_profiles")
        .insert({
          user_id: user.id,
          full_name: formData.full_name,
          phone: formData.phone || null,
          date_of_birth: formData.date_of_birth?.toISOString().split("T")[0] || null,
          university_name: formData.university_name,
          degree_name: formData.degree_name,
          major: formData.major,
          degree_level: formData.degree_level,
          bio: formData.bio || null,
          areas_of_interest: formData.areas_of_interest,
          expertise: formData.expertise,
          open_to_paid: formData.open_to_paid,
          open_to_voluntary: formData.open_to_voluntary,
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
          Complete Your Profile
        </Text>
        <Text className="text-slate-600 mb-4">
          Step {step} of 3
        </Text>

        {/* Progress Bar */}
        <View className="flex-row mb-6">
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              className={`flex-1 h-2 rounded-full mx-1 ${
                s <= step ? "bg-primary" : "bg-slate-200"
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

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <View className="space-y-4">
            <Input
              label="Full Name *"
              placeholder="Enter your full name"
              value={formData.full_name}
              onChangeText={(text) => setFormData({ ...formData, full_name: text })}
            />

            <PhoneInput
              label="Phone Number *"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
            />

            {/* Date of Birth */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-slate-700 mb-2">
                Date of Birth * (Must be 18+)
              </Text>
              <TouchableOpacity
                className="border border-slate-200 rounded-xl px-4 py-3 bg-white"
                onPress={() => setShowDatePicker(true)}
              >
                <Text className={formData.date_of_birth ? "text-slate-800" : "text-slate-400"}>
                  {formData.date_of_birth
                    ? formData.date_of_birth.toLocaleDateString()
                    : "Select your date of birth"}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={formData.date_of_birth || getMaxDate()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  maximumDate={getMaxDate()}
                  onChange={(event, date) => {
                    setShowDatePicker(Platform.OS === "ios");
                    if (date) {
                      setFormData({ ...formData, date_of_birth: date });
                    }
                  }}
                />
              )}
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

        {/* Step 2: Education */}
        {step === 2 && (
          <View className="space-y-4">
            {/* Avatar Upload */}
            <View className="items-center mb-6">
              <Text className="text-sm font-medium text-slate-700 mb-3">
                Profile Photo (Optional)
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
                <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary items-center justify-center">
                  <Camera color="white" size={16} />
                </View>
              </TouchableOpacity>
              {isUploadingAvatar && (
                <Text className="text-sm text-slate-500 mt-2">Uploading...</Text>
              )}
            </View>

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

            <View>
              <Text className="text-sm font-medium text-slate-700 mb-2">
                Bio * (Min 25 characters)
              </Text>
              <Input
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                multiline
                numberOfLines={4}
                style={{ height: 100, textAlignVertical: "top" }}
              />
              <Text className="text-xs text-slate-500 mt-1">
                {formData.bio.length}/25 characters minimum
              </Text>
            </View>

            <View className="flex-row justify-between mt-4">
              <Button variant="outline" onPress={() => setStep(1)} className="flex-1 mr-2">
                Previous
              </Button>
              <Button onPress={handleNextStep} className="flex-1 ml-2">
                Next Step
              </Button>
            </View>
          </View>
        )}

        {/* Step 3: Interests & Preferences */}
        {step === 3 && (
          <View className="space-y-4">
            <MultiSelect
              label="Areas of Interest * (At least one)"
              value={formData.areas_of_interest}
              options={expertiseOptions}
              onValueChange={(value) =>
                setFormData({ ...formData, areas_of_interest: value })
              }
              placeholder="Select areas you're interested in..."
              maxSelections={10}
            />

            <MultiSelect
              label="Your Expertise * (At least one)"
              value={formData.expertise}
              options={expertiseOptions}
              onValueChange={(value) =>
                setFormData({ ...formData, expertise: value })
              }
              placeholder="Select your skills..."
              maxSelections={10}
            />

            <View className="mb-4">
              <Text className="text-sm font-medium text-slate-700 mb-3">
                Work Preferences * (At least one)
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

            <View className="flex-row justify-between mt-4">
              <Button variant="outline" onPress={() => setStep(2)} className="flex-1 mr-2">
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
