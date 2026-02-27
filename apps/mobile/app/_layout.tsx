import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useNotifications } from "@/hooks/useNotifications";
import { UnreadMessagesProvider } from "@/context/UnreadMessagesContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { CustomSplashScreen } from "@/components/SplashScreen";
import * as Linking from "expo-linking";
import "../global.css";

// Prevent splash screen from auto-hiding - we'll control it manually
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  // Initialize push notifications
  const { expoPushToken } = useNotifications();
  
  // Get router and segments - these are safe to use in RootLayout
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Hide the default native splash screen immediately so only custom splash shows
    // This prevents the double splash screen issue
    SplashScreen.hideAsync().catch(() => {
      // Ignore errors if splash screen is already hidden
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
      setIsMounted(true); // Mark as mounted after initial session check
    });

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        // Navigation will be handled by the second useEffect
      }
    );

    // Handle deep links
    const handleDeepLink = async (url: string | null) => {
      if (!url) return;

      try {
        const parsedUrl = Linking.parse(url);
        
        // Handle firstprinciplebiz:// scheme
        if (parsedUrl.scheme === "firstprinciplebiz" || parsedUrl.hostname === "www.firstprinciple.biz") {
          const path = parsedUrl.path || "";
          const queryParams = parsedUrl.queryParams || {};

          // Handle auth callback
          if (path.includes("auth/callback") || path.includes("auth/callback")) {
            if (queryParams.code) {
              router.push({
                pathname: "/auth/callback",
                params: queryParams,
              });
            }
          }
          // Handle password reset
          else if (path.includes("auth/reset-password") || path.includes("auth/reset-password")) {
            if (queryParams.code) {
              router.push({
                pathname: "/(auth)/reset-password",
                params: { code: queryParams.code as string },
              });
            }
          }
        }
      } catch (error) {
        console.error("Error handling deep link:", error);
      }
    };

    // Get initial URL (if app was opened via deep link)
    Linking.getInitialURL().then(handleDeepLink);

    // Listen for deep links while app is running
    const linkingSubscription = Linking.addEventListener("url", (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      authSubscription.unsubscribe();
      linkingSubscription.remove();
    };
  }, [router]);

  useEffect(() => {
    // Don't navigate until component is mounted and loading is complete
    if (isLoading || !isMounted) return;
    
    // Ensure segments are available
    if (!segments || segments.length === 0) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inAuthCallback = segments[0] === "auth"; // For auth/callback deep link
    const inTabsGroup = segments[0] === "(tabs)";

    const handleAuthNavigation = async () => {
      try {
        // CRITICAL: If no session, ALWAYS redirect to login unless already in auth routes
        // This prevents any access to protected routes without authentication
        if (!session) {
          if (!inAuthGroup && !inAuthCallback) {
            router.replace("/(auth)/login");
          }
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
        
        // CRITICAL: If user is trying to access tabs/dashboard, ensure they have valid session
        if (inTabsGroup || (!inAuthGroup && !inAuthCallback && segments.length > 0)) {
          // User is trying to access protected routes
          if (!session || !session.user.email_confirmed_at) {
            router.replace("/(auth)/login");
            return;
          }
          
          // Verify user profile exists and is completed
          const { data: userData } = await supabase
            .from("users")
            .select("role, profile_completed")
            .eq("id", session.user.id)
            .single();

          if (!userData || !userData.profile_completed) {
            // User needs onboarding
            if (!userData) {
              router.replace("/(auth)/select-role");
            } else {
              router.replace(`/(auth)/onboarding/${userData.role}`);
            }
            return;
          }
        }
        
        // If verified user is in auth group, check if they need onboarding
        if (session && session.user.email_confirmed_at && inAuthGroup) {
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
      } catch (error) {
        console.error("Error in handleAuthNavigation:", error);
      }
    };
    
    handleAuthNavigation();
  }, [session, segments, isLoading, isMounted, router]);

  if (showSplash) {
    return <CustomSplashScreen onFinish={() => setShowSplash(false)} />;
  }

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
          <Stack.Screen 
            name="settings" 
            options={{ 
              headerShown: true,
              title: "Settings",
              headerBackTitle: "Back"
            }} 
          />
        </Stack>
      </UnreadMessagesProvider>
    </NotificationsProvider>
  );
}

