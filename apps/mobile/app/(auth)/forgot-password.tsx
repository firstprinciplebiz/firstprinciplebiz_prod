import { useState } from "react";
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
import { Link, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      setIsSuccess(true);
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <View className="flex-1 bg-white justify-center px-6">
        <View className="items-center">
          <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6">
            <Text className="text-4xl">✓</Text>
          </View>
          <Text className="text-2xl font-bold text-slate-900 text-center mb-2">
            Check Your Email
          </Text>
          <Text className="text-slate-600 text-center mb-8">
            We've sent a password reset link to {email}
          </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity className="bg-primary py-4 px-8 rounded-xl">
              <Text className="text-white font-semibold">Back to Login</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-6">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-slate-900 text-center">
            Forgot Password?
          </Text>
          <Text className="text-base text-slate-600 text-center mt-2">
            Enter your email and we'll send you a reset link
          </Text>
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

          <TouchableOpacity
            className={`w-full py-4 rounded-xl ${
              isLoading ? "bg-primary/70" : "bg-primary"
            }`}
            onPress={handleResetPassword}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold text-base">
                Send Reset Link
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="mt-8 flex-row justify-center">
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text className="text-primary font-semibold">Back to Login</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}



