import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings, Shield, FileText, UserX, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
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

