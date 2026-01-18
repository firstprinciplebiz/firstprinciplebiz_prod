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
        // Get the current URL to extract tokens/codes
        let url = await Linking.getInitialURL();
        
        // Also check params from expo-router
        const code = params.code as string | undefined;
        const type = params.type as string | undefined;
        const access_token = params.access_token as string | undefined;
        const refresh_token = params.refresh_token as string | undefined;

        // Handle email verification or password reset
        if (code && type === "recovery") {
          // Password reset - redirect to reset password screen
          router.replace({
            pathname: "/(auth)/reset-password",
            params: { code },
          });
          return;
        }

        // Handle email verification code
        // Check for signup type in params or try to verify as signup
        if (code) {
          // Try signup verification first (most common case)
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token: code,
            type: type === "signup" ? "signup" : "email", // Try both signup and email types
          });

          if (verifyError) {
            // If signup fails, try email type
            if (type !== "email") {
              const { error: emailVerifyError } = await supabase.auth.verifyOtp({
                token: code,
                type: "email",
              });
              
              if (emailVerifyError) {
                console.error("Email verification error:", emailVerifyError);
                router.replace("/(auth)/login");
                return;
              }
            } else {
              console.error("Email verification error:", verifyError);
              router.replace("/(auth)/login");
              return;
            }
          }

          // Wait a moment for session to be established after verification
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Get session after verification
          const { data: { session: verifiedSession } } = await supabase.auth.getSession();
          
          if (!verifiedSession || !verifiedSession.user) {
            console.error("No session after email verification");
            router.replace("/(auth)/login");
            return;
          }

          // Email verified, check user status
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("role, profile_completed")
            .eq("id", verifiedSession.user.id)
            .single();

          if (userError || !userData) {
            // Create user record if it doesn't exist
            const role = verifiedSession.user.user_metadata?.role || "student";
            const { error: insertError } = await supabase.from("users").insert({
              id: verifiedSession.user.id,
              email: verifiedSession.user.email,
              role: role,
              profile_completed: false,
            });
            
            if (insertError) {
              console.error("Error creating user record:", insertError);
            }
            
            // Always redirect to onboarding after email verification if profile not completed
            router.replace(`/(auth)/onboarding/${role}`);
            return;
          }

          // User exists, check if profile is completed
          if (!userData.profile_completed) {
            // Redirect to onboarding - this is the expected behavior after email verification
            router.replace(`/(auth)/onboarding/${userData.role}`);
          } else {
            router.replace("/(tabs)");
          }
          return;
        }

        // Handle OAuth callback with tokens in URL
        if (url) {
          const parsedUrl = new URL(url);
          const hashParams = new URLSearchParams(parsedUrl.hash.substring(1));
          const queryParams = new URLSearchParams(parsedUrl.search);
          
          const accessToken = access_token || hashParams.get("access_token") || queryParams.get("access_token");
          const refreshToken = refresh_token || hashParams.get("refresh_token") || queryParams.get("refresh_token");

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
  }, [router, params]);

  return (
    <View className="flex-1 bg-white items-center justify-center">
      <ActivityIndicator size="large" color="#2563EB" />
      <Text className="text-slate-600 mt-4">Signing you in...</Text>
    </View>
  );
}
