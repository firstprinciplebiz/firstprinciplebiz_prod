import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { supabase } from "@/lib/supabase";
import * as Linking from "expo-linking";

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string }>();

  useEffect(() => {
    // Verify that we have a valid reset token
    const verifyToken = async () => {
      if (!params.code) {
        Alert.alert("Error", "Invalid reset link. Please request a new password reset.");
        router.replace("/(auth)/forgot-password");
        return;
      }

      // Check if the code is valid by attempting to exchange it
      // We'll do this when the user submits the form
      setIsVerifying(false);
    };

    verifyToken();
  }, [params.code, router]);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
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

    if (!params.code) {
      Alert.alert("Error", "Invalid reset link");
      return;
    }

    setIsLoading(true);
    try {
      // Exchange the code for a session and update password
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token: params.code,
        type: "recovery",
      });

      if (verifyError) {
        Alert.alert("Error", "Invalid or expired reset link. Please request a new one.");
        router.replace("/(auth)/forgot-password");
        return;
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        Alert.alert("Error", updateError.message || "Failed to update password");
        return;
      }

      Alert.alert("Success", "Password reset successfully! You can now log in.", [
        {
          text: "OK",
          onPress: () => router.replace("/(auth)/login"),
        },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-slate-600 mt-4">Verifying reset link...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Reset Password" }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-white"
      >
        <View className="flex-1 justify-center px-6">
          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-slate-900 text-center">
              Reset Password
            </Text>
            <Text className="text-base text-slate-600 text-center mt-2">
              Enter your new password below
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-slate-700 mb-1.5">
                New Password
              </Text>
              <TextInput
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                placeholder="Enter new password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-slate-700 mb-1.5">
                Confirm Password
              </Text>
              <TextInput
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                placeholder="Confirm new password"
                placeholderTextColor="#94A3B8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              className={`w-full py-4 rounded-xl mt-4 ${
                isLoading ? "bg-primary/70" : "bg-primary"
              }`}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-base">
                  Reset Password
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}






