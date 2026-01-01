"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Textarea } from "@/components/ui";
import { applyToIssue } from "@/lib/issues/interest-actions";
import { Send, X } from "lucide-react";

interface ApplyButtonProps {
  issueId: string;
  studentProfileId: string;
}

export function ApplyButton({ issueId, studentProfileId }: ApplyButtonProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [coverMessage, setCoverMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await applyToIssue({
        issueId,
        studentProfileId,
        coverMessage: coverMessage || undefined,
      });

      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (!showForm) {
    return (
      <Button onClick={() => setShowForm(true)} className="w-full">
        <Send className="w-4 h-4 mr-2" />
        Apply for this Issue
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Apply for this Issue</h3>
        <button
          onClick={() => setShowForm(false)}
          className="p-1 hover:bg-slate-100 rounded"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <Textarea
        placeholder="Write a cover message explaining why you're a great fit for this issue... (optional but recommended)"
        value={coverMessage}
        onChange={(e) => setCoverMessage(e.target.value)}
        rows={4}
      />

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setShowForm(false)}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleApply}
          loading={isSubmitting}
          className="flex-1"
        >
          Submit Application
        </Button>
      </div>
    </div>
  );
}









