"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GraduationCap, Building2, Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [needsRole, setNeedsRole] = useState(false);
  const [isSettingRole, setIsSettingRole] = useState(false);

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // Check if user exists in our users table
    const { data: userData, error } = await supabase
      .from("users")
      .select("role, profile_completed")
      .eq("id", user.id)
      .single();

    if (error || !userData) {
      // User doesn't exist in our table - check for stored role
      // Priority: 1. localStorage (OAuth flow), 2. user_metadata (email signup)
      const storedRole = localStorage.getItem("signup_role");
      const metadataRole = user.user_metadata?.role;
      const role = storedRole || metadataRole;
      
      if (role && (role === "student" || role === "business")) {
        // Create user with the role
        const { error: insertError } = await supabase.from("users").insert({
          id: user.id,
          email: user.email,
          role: role,
          profile_completed: false,
        });
        
        if (storedRole) {
          localStorage.removeItem("signup_role");
        }
        
        if (!insertError) {
          // Redirect to profile completion
          router.push(`/onboarding/${role}`);
        } else {
          console.error("Error creating user:", insertError);
          setNeedsRole(true);
          setIsLoading(false);
        }
      } else {
        // Need to ask for role
        setNeedsRole(true);
        setIsLoading(false);
      }
      return;
    }

    // User exists, check profile completion
    if (userData.profile_completed) {
      router.push("/dashboard");
    } else {
      router.push(`/onboarding/${userData.role}`);
    }
  };

  const handleRoleSelect = async (role: "student" | "business") => {
    setIsSettingRole(true);
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // Create user record
    await supabase.from("users").upsert({
      id: user.id,
      email: user.email,
      role,
      profile_completed: false,
    });

    router.push(`/onboarding/${role}`);
  };

  if (isLoading && !needsRole) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-slate-600">Setting up your account...</p>
        </div>
      </div>
    );
  }

  if (needsRole) {
    return (
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Welcome to FirstPrincipleBiz!
          </h1>
          <p className="text-slate-600">
            How would you like to use the platform?
          </p>
        </div>

        <div className="grid gap-4">
          <button
            onClick={() => handleRoleSelect("student")}
            disabled={isSettingRole}
            className="group bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-primary hover:shadow-lg transition-all duration-300 text-left disabled:opacity-50"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-indigo-100 group-hover:bg-primary flex items-center justify-center transition-colors">
                <GraduationCap className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-900 mb-1">
                  I&apos;m a Student
                </h3>
                <p className="text-slate-600 text-sm">
                  Browse business challenges and gain real-world experience.
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect("business")}
            disabled={isSettingRole}
            className="group bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-emerald-500 hover:shadow-lg transition-all duration-300 text-left disabled:opacity-50"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-emerald-100 group-hover:bg-emerald-500 flex items-center justify-center transition-colors">
                <Building2 className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-900 mb-1">
                  I&apos;m a Business Owner
                </h3>
                <p className="text-slate-600 text-sm">
                  Post challenges and connect with talented students.
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return null;
}

