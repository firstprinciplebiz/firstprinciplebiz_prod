import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Share,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import {
  Shield,
  FileText,
  Trash2,
  ChevronRight,
  Gift,
  Copy,
  Users,
  UserPlus,
  ExternalLink,
} from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import * as Clipboard from "expo-clipboard";

interface ReferredUser {
  name: string;
  type: "student" | "business";
  createdAt: string;
}

export default function SettingsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referredByCode, setReferredByCode] = useState<string | null>(null);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [copied, setCopied] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user role
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!userData) return;
      setUserRole(userData.role);

      let code: string | null = null;
      let referredBy: string | null = null;

      if (userData.role === "student") {
        const { data: profile } = await supabase
          .from("student_profiles")
          .select("referral_code, referred_by_code")
          .eq("user_id", user.id)
          .single();
        code = profile?.referral_code || null;
        referredBy = profile?.referred_by_code || null;
      } else {
        const { data: profile } = await supabase
          .from("business_profiles")
          .select("referral_code, referred_by_code")
          .eq("user_id", user.id)
          .single();
        code = profile?.referral_code || null;
        referredBy = profile?.referred_by_code || null;
      }

      setReferralCode(code);
      setReferredByCode(referredBy);

      // Get referred users
      if (code) {
        const users: ReferredUser[] = [];

        const { data: students } = await supabase
          .from("student_profiles")
          .select("full_name, created_at")
          .eq("referred_by_code", code);

        if (students) {
          students.forEach((s) => {
            users.push({
              name: s.full_name || "Unknown",
              type: "student",
              createdAt: s.created_at,
            });
          });
        }

        const { data: businesses } = await supabase
          .from("business_profiles")
          .select("business_name, created_at")
          .eq("referred_by_code", code);

        if (businesses) {
          businesses.forEach((b) => {
            users.push({
              name: b.business_name || "Unknown",
              type: "business",
              createdAt: b.created_at,
            });
          });
        }

        users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReferredUsers(users);
      }
    } catch (error) {
      console.error("Error fetching settings data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopyCode = async () => {
    if (referralCode) {
      await Clipboard.setStringAsync(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareCode = async () => {
    if (referralCode) {
      try {
        await Share.share({
          message: `Join FirstPrincipleBiz using my referral code: ${referralCode}\n\nDownload the app or visit https://www.firstprinciple.biz`,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.\n\nYour email, phone, date of birth, and profile photos will be permanently deleted. Your name and messages will be retained for other users' records.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: confirmDeleteAccount,
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Call the delete account API
      const response = await fetch("https://www.firstprinciple.biz/api/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete account");
      }

      // Sign out and redirect
      await supabase.auth.signOut();
      Alert.alert("Account Deleted", "Your account has been deleted successfully.");
      router.replace("/(auth)/login");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Settings" }} />
      <ScrollView className="flex-1 bg-slate-50">
        <View className="p-4">
          {/* Referral Code Section */}
          {referralCode && (
            <Card className="p-4 mb-4">
              <View className="flex-row items-center mb-3">
                <View className="w-10 h-10 rounded-xl bg-amber-100 items-center justify-center mr-3">
                  <Gift color="#F59E0B" size={20} />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-slate-900">Your Referral Code</Text>
                  <Text className="text-sm text-slate-600">Share to invite friends</Text>
                </View>
              </View>

              {/* Code Display */}
              <View className="flex-row items-center mb-3">
                <View className="flex-1 bg-slate-100 rounded-xl px-4 py-3 mr-2">
                  <Text className="text-xl font-mono font-bold text-slate-800 text-center">
                    {referralCode}
                  </Text>
                </View>
                <TouchableOpacity
                  className={`px-4 py-3 rounded-xl ${copied ? "bg-green-500" : "bg-primary"}`}
                  onPress={handleCopyCode}
                >
                  <Copy color="white" size={20} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                className="bg-primary/10 py-2 rounded-lg items-center mb-4"
                onPress={handleShareCode}
              >
                <Text className="text-primary font-medium">Share Code</Text>
              </TouchableOpacity>

              {/* Referred By */}
              {referredByCode && (
                <View className="bg-slate-50 rounded-lg p-3 mb-4">
                  <View className="flex-row items-center">
                    <UserPlus color="#64748B" size={16} />
                    <Text className="text-slate-600 ml-2 text-sm">
                      You joined using code:{" "}
                      <Text className="font-mono font-semibold text-primary">{referredByCode}</Text>
                    </Text>
                  </View>
                </View>
              )}

              {/* Referred Users */}
              <View>
                <View className="flex-row items-center mb-2">
                  <Users color="#64748B" size={16} />
                  <Text className="text-sm font-semibold text-slate-700 ml-2">
                    Users who joined with your code ({referredUsers.length})
                  </Text>
                </View>

                {referredUsers.length === 0 ? (
                  <Text className="text-sm text-slate-500 italic">
                    No one has used your code yet
                  </Text>
                ) : (
                  <View className="space-y-2">
                    {referredUsers.slice(0, 5).map((user, index) => (
                      <View
                        key={index}
                        className="flex-row items-center justify-between bg-white border border-slate-200 rounded-lg p-3"
                      >
                        <View className="flex-row items-center">
                          <View
                            className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${
                              user.type === "student" ? "bg-primary" : "bg-emerald-500"
                            }`}
                          >
                            <Text className="text-white text-xs font-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View>
                            <Text className="text-sm font-medium text-slate-800">{user.name}</Text>
                            <Text className="text-xs text-slate-500">
                              {user.type === "student" ? "Student" : "Business"}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-xs text-slate-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    ))}
                    {referredUsers.length > 5 && (
                      <Text className="text-sm text-slate-500 text-center">
                        +{referredUsers.length - 5} more
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </Card>
          )}

          {/* Settings Links */}
          <Card className="mb-4">
            <TouchableOpacity
              className="flex-row items-center justify-between p-4 border-b border-slate-100"
              onPress={() => Linking.openURL("https://www.firstprinciple.biz/privacy")}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-lg bg-slate-100 items-center justify-center mr-3">
                  <Shield color="#64748B" size={20} />
                </View>
                <View>
                  <Text className="text-slate-900 font-medium">Privacy Policy</Text>
                  <Text className="text-xs text-slate-500">How we protect your data</Text>
                </View>
              </View>
              <ExternalLink color="#94A3B8" size={18} />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-between p-4 border-b border-slate-100"
              onPress={() => Linking.openURL("https://www.firstprinciple.biz/terms")}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-lg bg-slate-100 items-center justify-center mr-3">
                  <FileText color="#64748B" size={20} />
                </View>
                <View>
                  <Text className="text-slate-900 font-medium">Terms & Conditions</Text>
                  <Text className="text-xs text-slate-500">Our service agreement</Text>
                </View>
              </View>
              <ExternalLink color="#94A3B8" size={18} />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-between p-4"
              onPress={handleDeleteAccount}
              disabled={isDeleting}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-lg bg-red-100 items-center justify-center mr-3">
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <Trash2 color="#EF4444" size={20} />
                  )}
                </View>
                <View>
                  <Text className="text-red-600 font-medium">
                    {isDeleting ? "Deleting..." : "Delete Account"}
                  </Text>
                  <Text className="text-xs text-slate-500">Permanently delete your account</Text>
                </View>
              </View>
              <ChevronRight color="#94A3B8" size={20} />
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>
    </>
  );
}

