"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function GoBackButton({ className = "" }: { className?: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className={`inline-flex items-center gap-2 text-slate-600 hover:text-primary transition-colors ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      Go Back
    </button>
  );
}



