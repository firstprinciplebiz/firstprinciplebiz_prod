import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings, Shield, FileText, UserX, ChevronRight, Gift, Users, UserPlus } from "lucide-react";
import { Card } from "@/components/ui";
import { CopyReferralCode } from "./CopyReferralCode";

interface ReferredUser {
  name: string;
  type: "student" | "business";
  createdAt: string;
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user role and profile
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  let referralCode: string | null = null;
  let referredByCode: string | null = null;
  const referredUsers: ReferredUser[] = [];

  if (userData?.role === "student") {
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("referral_code, referred_by_code")
      .eq("user_id", user.id)
      .single();
    referralCode = profile?.referral_code || null;
    referredByCode = profile?.referred_by_code || null;

    // Get all users who used this referral code
    if (referralCode) {
      // Get students who used this code
      const { data: referredStudents } = await supabase
        .from("student_profiles")
        .select("full_name, created_at")
        .eq("referred_by_code", referralCode);
      
      if (referredStudents) {
        referredStudents.forEach((s) => {
          referredUsers.push({
            name: s.full_name || "Unknown",
            type: "student",
            createdAt: s.created_at,
          });
        });
      }

      // Get businesses who used this code
      const { data: referredBusinesses } = await supabase
        .from("business_profiles")
        .select("business_name, created_at")
        .eq("referred_by_code", referralCode);
      
      if (referredBusinesses) {
        referredBusinesses.forEach((b) => {
          referredUsers.push({
            name: b.business_name || "Unknown",
            type: "business",
            createdAt: b.created_at,
          });
        });
      }
    }
  } else if (userData?.role === "business") {
    const { data: profile } = await supabase
      .from("business_profiles")
      .select("referral_code, referred_by_code")
      .eq("user_id", user.id)
      .single();
    referralCode = profile?.referral_code || null;
    referredByCode = profile?.referred_by_code || null;

    // Get all users who used this referral code
    if (referralCode) {
      // Get students who used this code
      const { data: referredStudents } = await supabase
        .from("student_profiles")
        .select("full_name, created_at")
        .eq("referred_by_code", referralCode);
      
      if (referredStudents) {
        referredStudents.forEach((s) => {
          referredUsers.push({
            name: s.full_name || "Unknown",
            type: "student",
            createdAt: s.created_at,
          });
        });
      }

      // Get businesses who used this code
      const { data: referredBusinesses } = await supabase
        .from("business_profiles")
        .select("business_name, created_at")
        .eq("referred_by_code", referralCode);
      
      if (referredBusinesses) {
        referredBusinesses.forEach((b) => {
          referredUsers.push({
            name: b.business_name || "Unknown",
            type: "business",
            createdAt: b.created_at,
          });
        });
      }
    }
  }

  // Sort referred users by creation date (newest first)
  referredUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const settingsLinks = [
    {
      href: "/privacy",
      icon: Shield,
      title: "Privacy Policy",
      description: "Learn how we collect, use, and protect your data",
      external: true,
    },
    {
      href: "/terms",
      icon: FileText,
      title: "Terms and Conditions",
      description: "Review our terms of service and user agreement",
      external: true,
    },
    {
      href: "/settings/delete-account",
      icon: UserX,
      title: "Delete Account",
      description: "Permanently delete your account and associated data",
      danger: true,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        </div>
        <p className="text-slate-600 mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Referral Code Section */}
      {referralCode && (
        <Card padding="lg" className="mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Your Referral Code</h2>
              <p className="text-sm text-slate-600 mb-4">
                Share this code with friends to invite them to FirstPrincipleBiz
              </p>
              
              <CopyReferralCode code={referralCode} />
              
              {/* Referred by info */}
              {referredByCode && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 text-sm">
                    <UserPlus className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">
                      You joined using referral code: <span className="font-mono font-semibold text-primary">{referredByCode}</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Referred Users List */}
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">
                    Users who joined with your code ({referredUsers.length})
                  </h3>
                </div>
                
                {referredUsers.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">
                    No one has used your referral code yet. Share it to invite friends!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {referredUsers.map((referredUser, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                            referredUser.type === "student" ? "bg-primary" : "bg-emerald-500"
                          }`}>
                            {referredUser.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{referredUser.name}</p>
                            <p className="text-xs text-slate-500">
                              {referredUser.type === "student" ? "Student" : "Business"}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(referredUser.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Settings Links */}
      <Card padding="none">
        <div className="divide-y divide-slate-100">
          {settingsLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              className={`flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors group ${
                link.danger ? "hover:bg-red-50" : ""
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  link.danger
                    ? "bg-red-100 text-red-600"
                    : "bg-slate-100 text-slate-600 group-hover:bg-primary/10 group-hover:text-primary"
                }`}
              >
                <link.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3
                  className={`font-medium ${
                    link.danger ? "text-red-600" : "text-slate-900"
                  }`}
                >
                  {link.title}
                </h3>
                <p className="text-sm text-slate-500">{link.description}</p>
              </div>
              <ChevronRight
                className={`w-5 h-5 ${
                  link.danger ? "text-red-400" : "text-slate-400"
                } group-hover:translate-x-1 transition-transform`}
              />
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
