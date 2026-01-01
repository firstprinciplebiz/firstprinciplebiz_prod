import { View, Text, TouchableOpacity } from "react-native";
import { Link, useRouter, useLocalSearchParams } from "expo-router";
import { CheckCircle2, Mail, ArrowLeft } from "lucide-react-native";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  return (
    <View className="flex-1 bg-white justify-center px-6">
      <View className="items-center">
        {/* Success Icon */}
        <View className="w-20 h-20 rounded-full bg-emerald-100 items-center justify-center mb-6">
          <Mail color="#10B981" size={40} />
        </View>

        <Text className="text-2xl font-bold text-slate-900 text-center mb-3">
          Check Your Email
        </Text>

        <Text className="text-slate-600 text-center mb-2">
          We've sent a verification link to:
        </Text>

        {email && (
          <Text className="text-primary font-semibold text-center mb-6">
            {email}
          </Text>
        )}

        <View className="bg-slate-50 rounded-xl p-4 mb-8 w-full">
          <Text className="text-slate-600 text-center text-sm">
            Click the link in the email to verify your account. 
            Once verified, you can log in and complete your profile.
          </Text>
        </View>

        <View className="w-full space-y-3">
          <TouchableOpacity
            className="w-full py-4 rounded-xl bg-primary"
            onPress={() => router.replace("/(auth)/login")}
          >
            <Text className="text-white text-center font-semibold text-base">
              Go to Login
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-full py-4 rounded-xl border border-slate-200"
            onPress={() => router.replace("/(auth)/signup")}
          >
            <View className="flex-row items-center justify-center">
              <ArrowLeft color="#64748B" size={18} />
              <Text className="text-slate-600 text-center font-medium ml-2">
                Back to Sign Up
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text className="text-slate-500 text-sm text-center mt-8">
          Didn't receive the email? Check your spam folder or try signing up again.
        </Text>
      </View>
    </View>
  );
}


