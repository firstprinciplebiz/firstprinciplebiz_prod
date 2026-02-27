import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Get the user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Get role from user metadata (set during signup)
        const role = user.user_metadata?.role;
        
        // Check if user record exists
        const { data: userData } = await supabase
          .from("users")
          .select("profile_completed, role")
          .eq("id", user.id)
          .single();
        
        // If user record doesn't exist, create it now (after email verification)
        if (!userData) {
          await supabase.from("users").insert({
            id: user.id,
            email: user.email,
            role: role || "student",
            profile_completed: false,
          });
        }
        
        // Use role from users table if exists, otherwise from metadata
        const userRole = userData?.role || role;
        
        // Determine redirect URL
        let redirectUrl = next;
        
        // Check profile_completed from the latest userData query or assume false for new users
        const profileCompleted = userData?.profile_completed || false;
        
        if (!profileCompleted) {
          // New user or incomplete profile - redirect to role-specific onboarding
          if (userRole === "student") {
            redirectUrl = "/onboarding/student";
          } else if (userRole === "business") {
            redirectUrl = "/onboarding/business";
          } else {
            // Fallback: check if next param includes the role
            if (next.includes("/student")) {
              redirectUrl = "/onboarding/student";
            } else if (next.includes("/business")) {
              redirectUrl = "/onboarding/business";
            } else {
              // Default to student if role can't be determined
              redirectUrl = "/onboarding/student";
            }
          }
        }
        
        const forwardedHost = request.headers.get("x-forwarded-host");
        const isLocalEnv = process.env.NODE_ENV === "development";
        
        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${redirectUrl}`);
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${redirectUrl}`);
        } else {
          return NextResponse.redirect(`${origin}${redirectUrl}`);
        }
      }
      
      // Fallback redirect
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
