"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { updateInterestStatus } from "@/lib/issues/interest-actions";
import { Check, X } from "lucide-react";

interface ApplicantActionsProps {
  interestId: string;
}

export function ApplicantActions({ interestId }: ApplicantActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (status: "approved" | "rejected") => {
    setIsLoading(true);
    
    const result = await updateInterestStatus(interestId, status);
    
    if (!result.error) {
      router.refresh();
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleAction("rejected")}
        disabled={isLoading}
        className="text-red-600 border-red-200 hover:bg-red-50"
      >
        <X className="w-4 h-4 mr-1" />
        Reject
      </Button>
      <Button
        size="sm"
        onClick={() => handleAction("approved")}
        disabled={isLoading}
      >
        <Check className="w-4 h-4 mr-1" />
        Approve
      </Button>
    </div>
  );
}









