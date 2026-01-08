"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  Home,
  Search,
  PlusCircle,
  MessageSquare,
  User as UserIcon,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  FileText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NotificationBell } from "./NotificationBell";
import { MessageBadge, MessageBadgeMobile } from "./MessageBadge";

interface NavbarProps {
  user: User;
  role?: string;
}

export function Navbar({ user, role }: NavbarProps) {
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const studentLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/issues", label: "Browse Issues", icon: Search },
  ];

  const businessLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/my-issues", label: "My Issues", icon: FileText },
    { href: "/issues/new", label: "Post Issue", icon: PlusCircle },
  ];

  const links = role === "business" ? businessLinks : studentLinks;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <img 
              src="/icon.png" 
              alt="FirstPrincipleBiz" 
              className="w-9 h-9 rounded-lg object-contain"
            />
            <span className="font-bold text-lg text-slate-900 hidden sm:block">
              FirstPrinciple<span className="text-primary">Biz</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
            <MessageBadge />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <NotificationBell />

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-primary" />
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
              </button>

              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-20">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {user.email}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">
                        {role} Account
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-slate-700 hover:bg-slate-50"
                      >
                        <UserIcon className="w-4 h-4" />
                        View Profile
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-slate-700 hover:bg-slate-50"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 w-full disabled:opacity-50"
                      >
                        <LogOut className="w-4 h-4" />
                        {isLoggingOut ? "Logging out..." : "Log out"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            ))}
            <MessageBadgeMobile onClick={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}
    </nav>
  );
}

