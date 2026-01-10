"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui";
import { updateIssueStatus, deleteIssue } from "@/lib/issues/actions";
import { MoreVertical, XCircle, Trash2, UserX, UserPlus, CheckCircle } from "lucide-react";

interface IssueStatusActionsProps {
  issueId: string;
  currentStatus: string;
}

export function IssueStatusActions({ issueId, currentStatus }: IssueStatusActionsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.right - 220, // 220px = w-56
      });
    }
  }, [isOpen]);

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true);
    const result = await updateIssueStatus(issueId, newStatus);
    if (!result.error) {
      router.refresh();
    }
    setIsLoading(false);
    setIsOpen(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this issue? This action cannot be undone.")) {
      return;
    }
    setIsLoading(true);
    const result = await deleteIssue(issueId);
    if (!result.error) {
      router.refresh();
    }
    setIsLoading(false);
    setIsOpen(false);
  };

  const isActive = currentStatus === "open" || currentStatus === "in_progress_accepting";
  const isInProgress = currentStatus === "in_progress_accepting" || currentStatus === "in_progress_full";
  const isClosed = currentStatus === "closed" || currentStatus === "completed";

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
      >
        <MoreVertical className="w-4 h-4" />
      </Button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div
            className="fixed inset-0 z-50"
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="fixed w-56 bg-white rounded-xl shadow-lg border border-slate-200 z-50 py-1"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            {/* Stop accepting students - only show if accepting applications */}
            {isActive && (
              <button
                onClick={() => handleStatusChange("in_progress_full")}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <UserX className="w-4 h-4 text-orange-500" />
                Stop Accepting Students
              </button>
            )}

            {/* Resume accepting students - only show if fully staffed */}
            {currentStatus === "in_progress_full" && (
              <button
                onClick={() => handleStatusChange("in_progress_accepting")}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4 text-green-500" />
                Accept More Students
              </button>
            )}

            {/* Mark as completed - only show if in progress */}
            {isInProgress && (
              <button
                onClick={() => handleStatusChange("completed")}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4 text-green-500" />
                Mark as Completed
              </button>
            )}

            {/* Cancel issue - show if not already closed */}
            {!isClosed && (
              <>
                <hr className="my-1" />
                <button
                  onClick={() => handleStatusChange("closed")}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4 text-slate-500" />
                  Cancel Issue
                </button>
              </>
            )}

            {/* Delete - always show */}
            <hr className="my-1" />
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Issue
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

