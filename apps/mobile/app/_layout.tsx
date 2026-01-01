import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useNotifications } from "@/hooks/useNotifications";
import { UnreadMessagesProvider } from "@/context/UnreadMessagesContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import "../global.css";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();
  
  // Initialize push notifications
  const { expoPushToken } = useNotifications();

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
      SplashScreen.hideAsync();
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inAuthCallback = segments[0] === "auth"; // For auth/callback deep link

    const handleAuthNavigation = async () => {
      if (!session && !inAuthGroup && !inAuthCallback) {
        // Redirect to login if not authenticated
        router.replace("/(auth)/login");
        return;
      }
      
      // CRITICAL: Check if session exists but email is not verified
      if (session && !session.user.email_confirmed_at) {
        // User has session but email not verified - sign them out
        console.log("Unverified email detected, signing out...");
        await supabase.auth.signOut();
        router.replace("/(auth)/login");
        return;
      }
      
      if (session && session.user.email_confirmed_at && inAuthGroup) {
        // Verified user in auth group - check if they need onboarding
        const { data: userData } = await supabase
          .from("users")
          .select("role, profile_completed")
          .eq("id", session.user.id)
          .single();

        // Only redirect if profile is completed - let them stay in onboarding/select-role
        const currentRoute = segments.join("/");
        const isOnboardingRoute = currentRoute.includes("onboarding") || 
                                  currentRoute.includes("select-role") ||
                                  currentRoute.includes("verify-email");

        if (userData?.profile_completed && !isOnboardingRoute) {
          router.replace("/(tabs)");
        } else if (!userData && !isOnboardingRoute) {
          // No user record yet - they need to select role (for Google OAuth users)
          router.replace("/(auth)/select-role");
        }
      }
    };
    
    handleAuthNavigation();
  }, [session, segments, isLoading]);

  if (isLoading) {
    return null;
  }

  return (
    <NotificationsProvider>
      <UnreadMessagesProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen 
            name="issues/[id]" 
            options={{ 
              headerShown: true,
              title: "Issue Details",
              headerBackTitle: "Back"
            }} 
          />
          <Stack.Screen 
            name="issues/new" 
            options={{ 
              headerShown: true,
              title: "Post New Issue",
              headerBackTitle: "Back"
            }} 
          />
          <Stack.Screen 
            name="my-issues" 
            options={{ 
              headerShown: true,
              title: "My Issues",
              headerBackTitle: "Back"
            }} 
          />
          <Stack.Screen 
            name="my-applications" 
            options={{ 
              headerShown: true,
              title: "My Applications",
              headerBackTitle: "Back"
            }} 
          />
          <Stack.Screen 
            name="applicants" 
            options={{ 
              headerShown: true,
              title: "Student Applications",
              headerBackTitle: "Back"
            }} 
          />
          <Stack.Screen 
            name="profile/edit" 
            options={{ 
              headerShown: true,
              title: "Edit Profile",
              headerBackTitle: "Back"
            }} 
          />
          <Stack.Screen 
            name="profile/student/[id]" 
            options={{ 
              headerShown: true,
              title: "Student Profile",
              headerBackTitle: "Back"
            }} 
          />
          <Stack.Screen 
            name="profile/business/[id]" 
            options={{ 
              headerShown: true,
              title: "Business Profile",
              headerBackTitle: "Back"
            }} 
          />
          <Stack.Screen 
            name="chat/[issueId]/[participantId]" 
            options={{ 
              headerShown: true,
              title: "Chat",
              headerBackTitle: "Back"
            }} 
          />
          <Stack.Screen 
            name="auth/callback" 
            options={{ 
              headerShown: false
            }} 
          />
          <Stack.Screen 
            name="notifications" 
            options={{ 
              headerShown: true,
              title: "Notifications",
              headerBackTitle: "Back"
            }} 
          />
        </Stack>
      </UnreadMessagesProvider>
    </NotificationsProvider>
  );
}

