import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings, Shield, FileText, UserX, ChevronRight, Gift, Copy, Users } from "lucide-react";
import { Card } from "@/components/ui";
import { CopyReferralCode } from "./CopyReferralCode";

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
  let referralCount = 0;

  if (userData?.role === "student") {
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("referral_code")
      .eq("user_id", user.id)
      .single();
    referralCode = profile?.referral_code || null;

    // Count how many users used this referral code
    if (referralCode) {
      const { count: studentCount } = await supabase
        .from("student_profiles")
        .select("*", { count: "exact", head: true })
        .eq("referred_by_code", referralCode);
      const { count: businessCount } = await supabase
        .from("business_profiles")
        .select("*", { count: "exact", head: true })
        .eq("referred_by_code", referralCode);
      referralCount = (studentCount || 0) + (businessCount || 0);
    }
  } else if (userData?.role === "business") {
    const { data: profile } = await supabase
      .from("business_profiles")
      .select("referral_code")
      .eq("user_id", user.id)
      .single();
    referralCode = profile?.referral_code || null;

    // Count how many users used this referral code
    if (referralCode) {
      const { count: studentCount } = await supabase
        .from("student_profiles")
        .select("*", { count: "exact", head: true })
        .eq("referred_by_code", referralCode);
      const { count: businessCount } = await supabase
        .from("business_profiles")
        .select("*", { count: "exact", head: true })
        .eq("referred_by_code", referralCode);
      referralCount = (studentCount || 0) + (businessCount || 0);
    }
  }

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
              
              {/* Referral Stats */}
              <div className="mt-4 flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">
                  <span className="font-semibold text-primary">{referralCount}</span>
                  {referralCount === 1 ? " person" : " people"} joined using your code
                </span>
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
