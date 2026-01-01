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
import Constants from "expo-constants";

// Warm up browser for OAuth
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          Alert.alert(
            "Email Not Verified",
            "Please check your email and click the verification link before logging in.",
            [{ text: "OK" }]
          );
        } else if (error.message.includes("Invalid login credentials")) {
          Alert.alert("Login Failed", "Invalid email or password. Please try again.");
        } else {
          Alert.alert("Login Failed", error.message);
        }
        return;
      }

      // Check if email is confirmed - this is critical
      if (data.user && !data.user.email_confirmed_at) {
        // Sign out the unverified user immediately
        await supabase.auth.signOut();
        Alert.alert(
          "Email Not Verified",
          "Please verify your email before logging in. Check your inbox for the verification link.",
          [{ text: "OK" }]
        );
        return;
      }

      // Only proceed if we have a verified user
      if (data.user && data.user.email_confirmed_at) {
        // Check user record in database
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role, profile_completed")
          .eq("id", data.user.id)
          .single();

        if (userError || !userData) {
          // User is verified but has no user record yet
          // This could happen if database trigger failed
          // Create the user record with the role from metadata
          const role = data.user.user_metadata?.role || "student";
          const { error: insertError } = await supabase.from("users").insert({
            id: data.user.id,
            email: data.user.email,
            role: role,
            profile_completed: false,
          });

          if (insertError) {
            console.error("Error creating user record:", insertError);
            await supabase.auth.signOut();
            Alert.alert("Error", "Failed to initialize your account. Please try again.");
            return;
          }

          // Redirect to onboarding
          router.replace(`/(auth)/onboarding/${role}`);
        } else if (!userData.profile_completed) {
          router.replace(`/(auth)/onboarding/${userData.role}`);
        } else {
          router.replace("/(tabs)");
        }
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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
              // Check/create user record and determine next step
              const { data: userData, error: userError } = await supabase
                .from("users")
                .select("role, profile_completed")
                .eq("id", sessionData.user.id)
                .single();

              if (userError || !userData) {
                // New Google user - need to select role and complete onboarding
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
      console.error("Google login error:", error);
      Alert.alert("Error", error.message || "Failed to sign in with Google");
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
          <View className="mb-8">
            <Text className="text-3xl font-bold text-slate-900 text-center">
              Welcome Back
            </Text>
            <Text className="text-base text-slate-600 text-center mt-2">
              Sign in to continue to FirstPrincipleBiz
            </Text>
          </View>

          {/* Google Sign In */}
          <TouchableOpacity
            className={`w-full flex-row items-center justify-center py-4 rounded-xl border-2 border-slate-200 mb-6 ${
              isGoogleLoading ? "opacity-50" : ""
            }`}
            onPress={handleGoogleLogin}
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
            <Text className="text-slate-500 text-sm mx-4">or continue with email</Text>
            <View className="flex-1 h-px bg-slate-200" />
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
                placeholder="Enter your password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity className="self-end">
                <Text className="text-sm text-primary font-medium">
                  Forgot password?
                </Text>
              </TouchableOpacity>
            </Link>

            <TouchableOpacity
              className={`w-full py-4 rounded-xl mt-4 ${
                isLoading ? "bg-primary/70" : "bg-primary"
              }`}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-base">
                  Sign In
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="mt-8 flex-row justify-center">
            <Text className="text-slate-600">Don't have an account? </Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity>
                <Text className="text-primary font-semibold">Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Google Icon SVG as component
const GoogleIcon = () => (
  <View style={{ width: 20, height: 20 }}>
    <Text style={{ fontSize: 18 }}>🔵</Text>
  </View>
);
