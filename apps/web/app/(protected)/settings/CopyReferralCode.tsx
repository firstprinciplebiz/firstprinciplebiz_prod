"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyReferralCodeProps {
  code: string;
}

export function CopyReferralCode({ code }: CopyReferralCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-100 rounded-xl px-4 py-3 font-mono text-lg font-semibold text-slate-800 tracking-wider">
        {code}
      </div>
      <button
        onClick={handleCopy}
        className={`px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
          copied
            ? "bg-green-500 text-white"
            : "bg-primary text-white hover:bg-primary-dark"
        }`}
      >
        {copied ? (
          <>
            <Check className="w-5 h-5" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-5 h-5" />
            Copy
          </>
        )}
      </button>
    </div>
  );
}

