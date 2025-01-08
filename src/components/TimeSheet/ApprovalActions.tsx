import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { TimeSheetStatus } from '@/types/timesheet';
import { Check, X, Send } from "lucide-react";

interface ApprovalActionsProps {
  status: TimeSheetStatus;
  isManager: boolean;
  onSubmitForReview: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export const ApprovalActions = ({
  status,
  isManager,
  onSubmitForReview,
  onApprove,
  onReject
}: ApprovalActionsProps) => {
  const { toast } = useToast();

  const handleSubmitForReview = () => {
    onSubmitForReview();
    toast({
      title: "Timesheet Submitted",
      description: "Your timesheet has been submitted for review",
    });
  };

  const handleApprove = () => {
    onApprove();
    toast({
      title: "Timesheet Approved",
      description: "The timesheet has been approved",
    });
  };

  const handleReject = () => {
    onReject();
    toast({
      title: "Timesheet Rejected",
      description: "The timesheet has been sent back for revision",
    });
  };

  if (isManager && status === 'under-review') {
    return (
      <div className="flex gap-2">
        <Button onClick={handleApprove} variant="default">
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

  if (!isManager && (status === 'unconfirmed' || status === 'needs-revision')) {
    return (
      <Button onClick={handleSubmitForReview}>
        <Send className="h-4 w-4 mr-2" />
        Submit for Review
      </Button>
    );
  }

  return null;
};