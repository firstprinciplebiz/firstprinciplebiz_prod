import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Camera, User, Building2 } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/Input";
import { PhoneInput, isValidPhoneNumber } from "@/components/ui/PhoneInput";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select, MultiSelect } from "@/components/ui/Select";
import { INDUSTRIES, EXPERTISE_AREAS } from "@/constants";
import { decode } from "base64-arraybuffer";

type UserRole = "student" | "business";

export default function EditProfileScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [studentData, setStudentData] = useState({
    full_name: "",
    university_name: "",
    degree_name: "",
    major: "",
    bio: "",
    phone: "",
    areas_of_interest: [] as string[],
    expertise: [] as string[],
    open_to_paid: true,
    open_to_voluntary: true,
  });
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [businessData, setBusinessData] = useState({
    owner_name: "",
    business_name: "",
    industry: "",
    address: "",
    business_description: "",
    business_age_years: "",
    phone: "",
    email: "",
    looking_for: [] as string[],
  });
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
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

        if (userData.role === "student") {
          setUserEmail(userData.email || user.email || null);
          const { data } = await supabase
            .from("student_profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();
          if (data) {
            setAvatarUrl(data.avatar_url);
            setStudentData({
              full_name: data.full_name || "",
              university_name: data.university_name || "",
              degree_name: data.degree_name || "",
              major: data.major || "",
              bio: data.bio || "",
              phone: data.phone || "",
              areas_of_interest: data.areas_of_interest || [],
              expertise: data.expertise || [],
              open_to_paid: data.open_to_paid ?? true,
              open_to_voluntary: data.open_to_voluntary ?? true,
            });
          }
        } else {
          const { data } = await supabase
            .from("business_profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();
          if (data) {
            setAvatarUrl(data.avatar_url);
            setBusinessData({
              owner_name: data.owner_name || "",
              business_name: data.business_name || "",
              industry: data.industry || "",
              address: data.address || "",
              business_description: data.business_description || "",
              business_age_years: data.business_age_years?.toString() || "",
              phone: data.phone || "",
              email: data.email || userData.email || "",
              looking_for: data.looking_for || [],
            });
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please allow access to your photos in Settings");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          await uploadAvatar(asset.base64, asset.uri);
        } else {
          Alert.alert("Error", "Could not read image data");
        }
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const uploadAvatar = async (base64: string, uri: string) => {
    setIsUploadingAvatar(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const ext = uri.split(".").pop()?.toLowerCase() || "jpg";
      const contentType = ext === "png" ? "image/png" : "image/jpeg";
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      const arrayBuffer = decode(base64);

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, arrayBuffer, {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);

      const table = role === "student" ? "student_profiles" : "business_profiles";
      const { error: updateError } = await supabase
        .from(table)
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Update error:", updateError);
        throw updateError;
      }

      Alert.alert("Success", "Profile picture updated!");
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      Alert.alert("Error", error.message || "Failed to upload image");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    // Validate student data
    if (role === "student") {
      if (!studentData.full_name || studentData.full_name.trim().length < 2) {
        Alert.alert("Validation Error", "Full name must be at least 2 characters");
        return;
      }
      if (studentData.phone && !isValidPhoneNumber(studentData.phone)) {
        Alert.alert("Validation Error", "Phone number must be exactly 10 digits");
        return;
      }
      if (!studentData.university_name || studentData.university_name.trim().length < 2) {
        Alert.alert("Validation Error", "University name is required");
        return;
      }
      if (!studentData.degree_name || studentData.degree_name.trim().length < 2) {
        Alert.alert("Validation Error", "Degree name is required");
        return;
      }
      if (!studentData.major || studentData.major.trim().length < 2) {
        Alert.alert("Validation Error", "Major is required");
        return;
      }
      if (studentData.bio && studentData.bio.trim().length > 0 && studentData.bio.trim().length < 25) {
        Alert.alert("Validation Error", "Bio must be at least 25 characters if provided");
        return;
      }
      if (!studentData.areas_of_interest || studentData.areas_of_interest.length === 0) {
        Alert.alert("Validation Error", "Please select at least one area of interest");
        return;
      }
      if (!studentData.expertise || studentData.expertise.length === 0) {
        Alert.alert("Validation Error", "Please select at least one expertise");
        return;
      }
      if (!studentData.open_to_paid && !studentData.open_to_voluntary) {
        Alert.alert("Validation Error", "Please select at least one work preference");
        return;
      }
    } else {
      // Validate business data
      if (!businessData.owner_name || businessData.owner_name.trim().length < 2) {
        Alert.alert("Validation Error", "Owner name must be at least 2 characters");
        return;
      }
      if (businessData.phone && !isValidPhoneNumber(businessData.phone)) {
        Alert.alert("Validation Error", "Phone number must be exactly 10 digits");
        return;
      }
      if (!businessData.business_name || businessData.business_name.trim().length < 2) {
        Alert.alert("Validation Error", "Business name is required");
        return;
      }
      if (!businessData.industry) {
        Alert.alert("Validation Error", "Industry is required");
        return;
      }
      if (businessData.business_description && businessData.business_description.trim().length > 0 && businessData.business_description.trim().length < 25) {
        Alert.alert("Validation Error", "Business description must be at least 25 characters if provided");
        return;
      }
      if (!businessData.looking_for || businessData.looking_for.length === 0) {
        Alert.alert("Validation Error", "Please select at least one type of help you're looking for");
        return;
      }
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (role === "student") {
        const updateData = {
          full_name: studentData.full_name,
          university_name: studentData.university_name,
          degree_name: studentData.degree_name,
          major: studentData.major,
          bio: studentData.bio,
          phone: studentData.phone || null,
          areas_of_interest: studentData.areas_of_interest,
          expertise: studentData.expertise,
          open_to_paid: studentData.open_to_paid,
          open_to_voluntary: studentData.open_to_voluntary,
        };
        const { error } = await supabase
          .from("student_profiles")
          .update(updateData)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const updateData = {
          owner_name: businessData.owner_name,
          business_name: businessData.business_name,
          industry: businessData.industry,
          address: businessData.address,
          business_description: businessData.business_description,
          business_age_years: businessData.business_age_years ? parseInt(businessData.business_age_years) : null,
          phone: businessData.phone,
          looking_for: businessData.looking_for,
        };
        const { error } = await supabase
          .from("business_profiles")
          .update(updateData)
          .eq("user_id", user.id);
        if (error) throw error;
      }

      Alert.alert("Success", "Profile updated successfully");
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const industryOptions = INDUSTRIES.map((i) => ({ value: i, label: i }));
  const expertiseOptions = EXPERTISE_AREAS.map((e) => ({ value: e, label: e }));

  return (
    <>
      <Stack.Screen options={{ title: "Edit Profile" }} />
      <ScrollView className="flex-1 bg-slate-50">
        <View className="p-4">
          {/* Avatar */}
          <Card className="p-6 items-center mb-4">
            <TouchableOpacity onPress={handlePickImage} disabled={isUploadingAvatar}>
              <View className="w-24 h-24 rounded-full bg-slate-100 items-center justify-center overflow-hidden">
                {isUploadingAvatar ? (
                  <ActivityIndicator size="large" color="#2563EB" />
                ) : avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={{ width: 96, height: 96 }}
                  />
                ) : role === "student" ? (
                  <User color="#94A3B8" size={48} />
                ) : (
                  <Building2 color="#94A3B8" size={48} />
                )}
              </View>
              <View className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full items-center justify-center">
                <Camera color="white" size={16} />
              </View>
            </TouchableOpacity>
            <Text className="text-sm text-slate-600 mt-3">
              {isUploadingAvatar ? "Uploading..." : "Tap to change photo"}
            </Text>
          </Card>

          {/* Form */}
          <Card className="p-4 mb-4">
            {role === "student" ? (
              <View>
                <Input
                  label="Full Name"
                  value={studentData.full_name}
                  onChangeText={(text) =>
                    setStudentData({ ...studentData, full_name: text })
                  }
                />
                
                {/* Email - Read Only */}
                {userEmail && (
                  <View className="mb-4">
                    <Text className="text-sm font-medium text-slate-700 mb-1.5">Email</Text>
                    <View className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-3">
                      <Text className="text-slate-600">{userEmail}</Text>
                    </View>
                    <Text className="text-xs text-slate-400 mt-1">Email cannot be changed here</Text>
                  </View>
                )}
                
                <PhoneInput
                  label="Phone"
                  value={studentData.phone}
                  onChangeText={(text) =>
                    setStudentData({ ...studentData, phone: text })
                  }
                  placeholder="1234567890"
                />
                
                <Input
                  label="University"
                  value={studentData.university_name}
                  onChangeText={(text) =>
                    setStudentData({ ...studentData, university_name: text })
                  }
                />
                <Input
                  label="Degree"
                  value={studentData.degree_name}
                  onChangeText={(text) =>
                    setStudentData({ ...studentData, degree_name: text })
                  }
                />
                <Input
                  label="Major"
                  value={studentData.major}
                  onChangeText={(text) =>
                    setStudentData({ ...studentData, major: text })
                  }
                />
                <Input
                  label="Bio"
                  value={studentData.bio}
                  onChangeText={(text) =>
                    setStudentData({ ...studentData, bio: text })
                  }
                  multiline
                  numberOfLines={4}
                  style={{ height: 100, textAlignVertical: "top" }}
                  placeholder="Tell us about yourself..."
                />
                
                {/* Areas of Interest */}
                <MultiSelect
                  label="Areas of Interest"
                  value={studentData.areas_of_interest}
                  options={expertiseOptions}
                  onValueChange={(value) =>
                    setStudentData({ ...studentData, areas_of_interest: value })
                  }
                  placeholder="Select areas you're interested in..."
                  maxSelections={10}
                />
                
                {/* Expertise */}
                <MultiSelect
                  label="Your Expertise"
                  value={studentData.expertise}
                  options={expertiseOptions}
                  onValueChange={(value) =>
                    setStudentData({ ...studentData, expertise: value })
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
                      studentData.open_to_paid
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 bg-white"
                    }`}
                    onPress={() =>
                      setStudentData({ ...studentData, open_to_paid: !studentData.open_to_paid })
                    }
                  >
                    <View
                      className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
                        studentData.open_to_paid
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-slate-300"
                      }`}
                    >
                      {studentData.open_to_paid && (
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
                      studentData.open_to_voluntary
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 bg-white"
                    }`}
                    onPress={() =>
                      setStudentData({ ...studentData, open_to_voluntary: !studentData.open_to_voluntary })
                    }
                  >
                    <View
                      className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
                        studentData.open_to_voluntary
                          ? "border-primary bg-primary"
                          : "border-slate-300"
                      }`}
                    >
                      {studentData.open_to_voluntary && (
                        <Text className="text-white text-xs font-bold">✓</Text>
                      )}
                    </View>
                    <View>
                      <Text className="text-slate-900 font-medium">Open to Voluntary Work</Text>
                      <Text className="text-slate-500 text-xs">I'm interested in volunteer/unpaid opportunities</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                <Input
                  label="Owner Name"
                  value={businessData.owner_name}
                  onChangeText={(text) =>
                    setBusinessData({ ...businessData, owner_name: text })
                  }
                />
                <Input
                  label="Business Name"
                  value={businessData.business_name}
                  onChangeText={(text) =>
                    setBusinessData({ ...businessData, business_name: text })
                  }
                />
                
                <Select
                  label="Industry"
                  value={businessData.industry}
                  options={industryOptions}
                  onValueChange={(value) =>
                    setBusinessData({ ...businessData, industry: value })
                  }
                  placeholder="Select industry..."
                />

                <Input
                  label="Years in Business"
                  value={businessData.business_age_years}
                  onChangeText={(text) =>
                    setBusinessData({ ...businessData, business_age_years: text.replace(/[^0-9]/g, '') })
                  }
                  keyboardType="numeric"
                  placeholder="e.g., 5"
                />

                <Input
                  label="Business Address"
                  value={businessData.address}
                  onChangeText={(text) =>
                    setBusinessData({ ...businessData, address: text })
                  }
                  placeholder="123 Main St, City, Country"
                />

                <PhoneInput
                  label="Phone"
                  value={businessData.phone}
                  onChangeText={(text) =>
                    setBusinessData({ ...businessData, phone: text })
                  }
                  placeholder="1234567890"
                />

                {businessData.email && (
                  <View className="mb-4">
                    <Text className="text-sm font-medium text-slate-700 mb-1.5">Email</Text>
                    <View className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-3">
                      <Text className="text-slate-600">{businessData.email}</Text>
                    </View>
                    <Text className="text-xs text-slate-400 mt-1">Email cannot be changed here</Text>
                  </View>
                )}

                <Input
                  label="About Business"
                  value={businessData.business_description}
                  onChangeText={(text) =>
                    setBusinessData({ ...businessData, business_description: text })
                  }
                  multiline
                  numberOfLines={4}
                  style={{ height: 100, textAlignVertical: "top" }}
                  placeholder="Describe your business..."
                />

                <MultiSelect
                  label="Looking for Help With"
                  value={businessData.looking_for}
                  options={expertiseOptions}
                  onValueChange={(value) =>
                    setBusinessData({ ...businessData, looking_for: value })
                  }
                  placeholder="Select areas..."
                  maxSelections={10}
                />
              </View>
            )}
          </Card>

          <Button onPress={handleSave} isLoading={isSaving}>
            Save Changes
          </Button>
        </View>
      </ScrollView>
    </>
  );
}
