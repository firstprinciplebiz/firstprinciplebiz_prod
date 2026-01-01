"use client";

import Link from "next/link";
import { GraduationCap, Building2, ArrowRight } from "lucide-react";

export default function LoginPortalPage() {
  return (
    <div className="w-full max-w-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          Welcome Back
        </h1>
        <p className="text-slate-600">
          Choose your portal to log in
        </p>
      </div>

      <div className="grid gap-4">
        <Link
          href="/student/login"
          className="group bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-primary hover:shadow-lg transition-all duration-300 text-left"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-indigo-100 group-hover:bg-primary flex items-center justify-center transition-colors">
              <GraduationCap className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-slate-900 mb-1">
                Student Login
              </h3>
              <p className="text-slate-600 text-sm">
                Access your student dashboard and browse opportunities.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all mt-2" />
          </div>
        </Link>

        <Link
          href="/business/login"
          className="group bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-emerald-500 hover:shadow-lg transition-all duration-300 text-left"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-emerald-100 group-hover:bg-emerald-500 flex items-center justify-center transition-colors">
              <Building2 className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-slate-900 mb-1">
                Business Login
              </h3>
              <p className="text-slate-600 text-sm">
                Manage your posted challenges and connect with students.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all mt-2" />
          </div>
        </Link>
      </div>

      <p className="text-center text-slate-600 mt-8">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary hover:text-primary-dark font-medium">
          Sign up
        </Link>
      </p>
    </div>
  );
}
