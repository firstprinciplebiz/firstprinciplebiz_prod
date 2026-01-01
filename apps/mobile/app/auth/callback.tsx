import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import * as Linking from "expo-linking";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the current URL to extract tokens
        const url = await Linking.getInitialURL();
        
        if (url) {
          const parsedUrl = new URL(url);
          const hashParams = new URLSearchParams(parsedUrl.hash.substring(1));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken && refreshToken) {
            const { data: sessionData, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) throw error;

            if (sessionData.user) {
              // Check if user exists and their profile status
              const { data: userData, error: userError } = await supabase
                .from("users")
                .select("role, profile_completed")
                .eq("id", sessionData.user.id)
                .single();

              if (userError || !userData) {
                // New user - need to select role
                router.replace("/(auth)/select-role");
              } else if (!userData.profile_completed) {
                router.replace(`/(auth)/onboarding/${userData.role}`);
              } else {
                router.replace("/(tabs)");
              }
              return;
            }
          }
        }

        // If no tokens found, check current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const { data: userData } = await supabase
            .from("users")
            .select("role, profile_completed")
            .eq("id", session.user.id)
            .single();

          if (!userData) {
            router.replace("/(auth)/select-role");
          } else if (!userData.profile_completed) {
            router.replace(`/(auth)/onboarding/${userData.role}`);
          } else {
            router.replace("/(tabs)");
          }
        } else {
          // No session, go to login
          router.replace("/(auth)/login");
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        router.replace("/(auth)/login");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <View className="flex-1 bg-white items-center justify-center">
      <ActivityIndicator size="large" color="#2563EB" />
      <Text className="text-slate-600 mt-4">Signing you in...</Text>
    </View>
  );
}


