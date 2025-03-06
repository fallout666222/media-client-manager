
import React from 'react';
import { Button } from "@/components/ui/button";
import { TimeSheetStatus } from '@/types/timesheet';
import { Check, X, Send, RotateCcw } from "lucide-react";

interface ApprovalActionsProps {
  status?: TimeSheetStatus;
  isManager?: boolean;
  isViewingOwnTimesheet?: boolean;
  isUserHead?: boolean; // Add this to identify if the viewer is a user head
  onSubmitForReview?: () => void;
  onApprove: () => void;
  onReject: () => void;
  disabled?: boolean;
  weekId?: string;
  adminOverride?: boolean; // Add this prop for admin override
}

export const ApprovalActions = ({
  status,
  isManager,
  isViewingOwnTimesheet,
  isUserHead = false, // Default to false
  onSubmitForReview,
  onApprove,
  onReject,
  disabled = false,
  weekId,
  adminOverride = false
}: ApprovalActionsProps) => {
  const handleReject = () => {
    onReject();
  };

  // For admin override, show all possible actions based on current status
  if (adminOverride) {
    return (
      <div className="flex gap-2 flex-wrap">
        {(status === 'unconfirmed' || status === 'needs-revision') && (
          <Button onClick={onSubmitForReview} disabled={disabled}>
            <Send className="h-4 w-4 mr-2" />
            Submit for Review
          </Button>
        )}
        
        {status === 'under-review' && (
          <>
            <Button onClick={onApprove} variant="default" disabled={disabled}>
              <Check className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button onClick={handleReject} variant="destructive" disabled={disabled}>
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </>
        )}
        
        {status === 'accepted' && (
          <Button 
            onClick={handleReject} 
            variant="outline" 
            disabled={disabled}
            className="border-amber-500 text-amber-500 hover:bg-amber-50"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Revert to Unconfirmed
          </Button>
        )}
      </div>
    );
  }

  // User Head can approve/reject timesheets under review for their team members
  if (isUserHead && !isViewingOwnTimesheet && status === 'under-review') {
    return (
      <div className="flex gap-2">
        <Button onClick={onApprove} variant="default" disabled={disabled}>
          <Check className="h-4 w-4 mr-2" />
          Approve
        </Button>
        <Button onClick={handleReject} variant="destructive" disabled={disabled}>
          <X className="h-4 w-4 mr-2" />
          Reject
        </Button>
      </div>
    );
  }

  // Original logic for managers
  if (isManager && !isViewingOwnTimesheet && status === 'under-review') {
    return (
      <div className="flex gap-2">
        <Button onClick={onApprove} variant="default" disabled={disabled}>
          <Check className="h-4 w-4 mr-2" />
          Approve
        </Button>
        <Button onClick={handleReject} variant="destructive" disabled={disabled}>
          <X className="h-4 w-4 mr-2" />
          Reject
        </Button>
      </div>
    );
  }

  if (isViewingOwnTimesheet && (status === 'unconfirmed' || status === 'needs-revision')) {
    return (
      <Button onClick={onSubmitForReview} disabled={disabled}>
        <Send className="h-4 w-4 mr-2" />
        Submit for Review
      </Button>
    );
  }

  return null;
};
