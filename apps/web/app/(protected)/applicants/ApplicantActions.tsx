"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui";
import { updateInterestStatus } from "@/lib/issues/interest-actions";

interface ApplicantActionsProps {
  interestId: string;
  issueId: string;
}

export function ApplicantActions({ interestId, issueId }: ApplicantActionsProps) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const result = await updateInterestStatus(interestId, "approved");
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    } catch {
      alert("Failed to approve application");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      const result = await updateInterestStatus(interestId, "rejected");
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    } catch {
      alert("Failed to reject application");
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleApprove}
        loading={isApproving}
        disabled={isApproving || isRejecting}
        className="!bg-emerald-500 hover:!bg-emerald-600 !px-4"
      >
        <Check className="w-4 h-4 mr-1" />
        Approve
      </Button>
      <Button
        onClick={handleReject}
        loading={isRejecting}
        disabled={isApproving || isRejecting}
        variant="outline"
        className="!border-red-300 !text-red-600 hover:!bg-red-50 !px-4"
      >
        <X className="w-4 h-4 mr-1" />
        Reject
      </Button>
    </>
  );
}




