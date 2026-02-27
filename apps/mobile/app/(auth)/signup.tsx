import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

// Warm up browser for OAuth
WebBrowser.maybeCompleteAuthSession();

type Role = "student" | "business";

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { role },
        },
      });

      if (error) {
        Alert.alert("Signup Failed", error.message);
        return;
      }

      if (data.user) {
        // Redirect to verification screen - user must verify email first
        router.replace({
          pathname: "/(auth)/verify-email",
          params: { email: email.trim() }
        });
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    try {
      // Get the redirect URL for deep linking
      const redirectUrl = Linking.createURL("auth/callback");
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Open the OAuth URL in a browser
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === "success" && result.url) {
          // Extract tokens from the URL
          const url = new URL(result.url);
          const params = new URLSearchParams(url.hash.substring(1));
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");

          if (accessToken && refreshToken) {
            // Set the session
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) throw sessionError;

            if (sessionData.user) {
              // Check if user already exists
              const { data: userData, error: userError } = await supabase
                .from("users")
                .select("role, profile_completed")
                .eq("id", sessionData.user.id)
                .single();

              if (userError || !userData) {
                // New Google user - need to select role
                router.replace("/(auth)/select-role");
              } else if (!userData.profile_completed) {
                router.replace(`/(auth)/onboarding/${userData.role}`);
              } else {
                router.replace("/(tabs)");
              }
            }
          }
        } else if (result.type === "cancel") {
          // User cancelled
        }
      }
    } catch (error: any) {
      console.error("Google signup error:", error);
      Alert.alert("Error", error.message || "Failed to sign up with Google");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-3xl font-bold text-slate-900 text-center">
              Create Account
            </Text>
            <Text className="text-base text-slate-600 text-center mt-2">
              Join FirstPrincipleBiz today
            </Text>
          </View>

          {/* Google Sign Up */}
          <TouchableOpacity
            className={`w-full flex-row items-center justify-center py-4 rounded-xl border-2 border-slate-200 mb-6 ${
              isGoogleLoading ? "opacity-50" : ""
            }`}
            onPress={handleGoogleSignup}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color="#64748B" />
            ) : (
              <>
                <GoogleIcon />
                <Text className="text-slate-700 font-medium ml-3">
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-slate-200" />
            <Text className="text-slate-500 text-sm mx-4">or sign up with email</Text>
            <View className="flex-1 h-px bg-slate-200" />
          </View>

          {/* Role Selection */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-slate-700 mb-3">
              I am a...
            </Text>
            <View className="flex-row space-x-3">
              <TouchableOpacity
                className={`flex-1 py-4 rounded-xl border-2 ${
                  role === "student"
                    ? "border-primary bg-primary/5"
                    : "border-slate-200 bg-white"
                }`}
                onPress={() => setRole("student")}
              >
                <Text
                  className={`text-center font-semibold ${
                    role === "student" ? "text-primary" : "text-slate-600"
                  }`}
                >
                  Student
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-4 rounded-xl border-2 ${
                  role === "business"
                    ? "border-primary bg-primary/5"
                    : "border-slate-200 bg-white"
                }`}
                onPress={() => setRole("business")}
              >
                <Text
                  className={`text-center font-semibold ${
                    role === "business" ? "text-primary" : "text-slate-600"
                  }`}
                >
                  Business
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form */}
          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-slate-700 mb-1.5">
                Email
              </Text>
              <TextInput
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                placeholder="Enter your email"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-slate-700 mb-1.5">
                Password
              </Text>
              <TextInput
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                placeholder="Create a password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-slate-700 mb-1.5">
                Confirm Password
              </Text>
              <TextInput
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                placeholder="Confirm your password"
                placeholderTextColor="#94A3B8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              className={`w-full py-4 rounded-xl mt-4 ${
                isLoading ? "bg-primary/70" : "bg-primary"
              }`}
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-base">
                  Create Account
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="mt-8 flex-row justify-center">
            <Text className="text-slate-600">Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-primary font-semibold">Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Google Icon placeholder
const GoogleIcon = () => (
  <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: 16 }}>G</Text>
  </View>
);
