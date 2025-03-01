
import React from 'react';
import { Button } from "@/components/ui/button";
import { TimeSheetStatus } from '@/types/timesheet';
import { Check, X, Send } from "lucide-react";

interface ApprovalActionsProps {
  status: TimeSheetStatus;
  isManager: boolean;
  isViewingOwnTimesheet: boolean;
  onSubmitForReview: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export const ApprovalActions = ({
  status,
  isManager,
  isViewingOwnTimesheet,
  onSubmitForReview,
  onApprove,
  onReject
}: ApprovalActionsProps) => {
  const handleReject = () => {
    onReject();
  };

  if (isManager && !isViewingOwnTimesheet && status === 'under-review') {
    return (
      <div className="flex gap-2">
        <Button onClick={onApprove} variant="default">
          <Check className="h-4 w-4 mr-2" />
          Approve
        </Button>
        <Button onClick={handleReject} variant="destructive">
          <X className="h-4 w-4 mr-2" />
          Reject
        </Button>
      </div>
    );
  }

  if (isViewingOwnTimesheet && (status === 'unconfirmed' || status === 'needs-revision')) {
    return (
      <Button onClick={onSubmitForReview}>
        <Send className="h-4 w-4 mr-2" />
        Submit for Review
      </Button>
    );
  }

  return null;
};
