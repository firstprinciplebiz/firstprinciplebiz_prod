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
        // Check if user record exists and get role
        const { data: userData } = await supabase
          .from("users")
          .select("profile_completed, role")
          .eq("id", user.id)
          .single();
        
        // Get role from user metadata (set during signup) or from users table
        const role = userData?.role || user.user_metadata?.role;
        
        // Determine redirect URL
        let redirectUrl = next;
        
        if (!userData || !userData.profile_completed) {
          // New user or incomplete profile - redirect to role-specific onboarding
          if (role === "student") {
            redirectUrl = "/onboarding/student";
          } else if (role === "business") {
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
