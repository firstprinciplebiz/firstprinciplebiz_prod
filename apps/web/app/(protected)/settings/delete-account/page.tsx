"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Trash2, Check, X, Loader2 } from "lucide-react";
import { Button, Card } from "@/components/ui";

export default function DeleteAccountPage() {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== "DELETE") {
      setError("Please type DELETE to confirm");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        setError(result.error || "Failed to delete account");
        setIsDeleting(false);
        return;
      }

      // Redirect to home page after successful deletion
      router.push("/");
    } catch (err) {
      console.error("Delete error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Link */}
      <Link
        href="/settings"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Settings
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Delete Account</h1>
            <p className="text-slate-600">Permanently delete your account and data</p>
          </div>
        </div>
      </div>

      {/* Warning */}
      <Card className="mb-6 border-red-200 bg-red-50">
        <div className="flex gap-4 p-4">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800">This action cannot be undone</h3>
            <p className="text-red-700 text-sm mt-1">
              Once you delete your account, your personal data will be permanently removed 
              and you will not be able to recover it.
            </p>
          </div>
        </div>
      </Card>

      {/* What will be deleted */}
      <Card padding="lg" className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          What will be permanently deleted:
        </h2>
        <ul className="space-y-3">
          {[
            "Your email address",
            "Your phone number",
            "Your date of birth (students)",
            "Your business address (businesses)",
            "Your profile photo",
          ].map((item) => (
            <li key={item} className="flex items-center gap-3 text-slate-600">
              <X className="w-5 h-5 text-red-500 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </Card>

      {/* What will be retained */}
      <Card padding="lg" className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          What will be retained:
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          To maintain platform integrity and preserve other users&apos; records:
        </p>
        <ul className="space-y-3">
          {[
            "Your name (displayed in past messages)",
            "Messages you sent (visible to recipients)",
            "Files shared in conversations",
            "Your application or issue history",
          ].map((item) => (
            <li key={item} className="flex items-center gap-3 text-slate-600">
              <Check className="w-5 h-5 text-amber-500 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </Card>

      {/* Automatic Actions */}
      <Card padding="lg" className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Automatic actions upon deletion:
        </h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3 text-slate-600">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>
              <strong>For students:</strong> All pending applications will be automatically rejected
            </span>
          </li>
          <li className="flex items-start gap-3 text-slate-600">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>
              <strong>For businesses:</strong> All open issues will be automatically closed
            </span>
          </li>
          <li className="flex items-start gap-3 text-slate-600">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>
              Existing conversations will be disabled (other users can view but not reply)
            </span>
          </li>
        </ul>
      </Card>

      {/* Delete Confirmation */}
      {!showConfirmDialog ? (
        <Button
          variant="danger"
          onClick={() => setShowConfirmDialog(true)}
          className="w-full"
        >
          <Trash2 className="w-5 h-5 mr-2" />
          I understand, delete my account
        </Button>
      ) : (
        <Card padding="lg" className="border-red-200">
          <h3 className="font-semibold text-slate-900 mb-4">
            Confirm Account Deletion
          </h3>
          <p className="text-slate-600 mb-4">
            Type <strong>DELETE</strong> to confirm you want to permanently delete your account:
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
            placeholder="Type DELETE"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all mb-4"
          />

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowConfirmDialog(false);
                setConfirmText("");
                setError(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={isDeleting || confirmText !== "DELETE"}
              className="flex-1"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5 mr-2" />
                  Delete Account
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}


