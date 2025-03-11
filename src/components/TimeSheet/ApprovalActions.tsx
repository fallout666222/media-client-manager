
import React from 'react';
import { Button } from "@/components/ui/button";
import { TimeSheetStatus } from '@/types/timesheet';
import { Check, X, Send, RotateCcw, AlertCircle } from "lucide-react";

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
  hasEarlierWeeksUnderReview?: boolean; // New prop to check if there are earlier weeks under review
  onNavigateToFirstUnderReview?: () => void; // Add this for navigation to first under review week
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
  adminOverride = false,
  hasEarlierWeeksUnderReview = false, // Default to false
  onNavigateToFirstUnderReview
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
  // But only in chronological order (no earlier weeks under review)
  if (isUserHead && !isViewingOwnTimesheet) {
    if (status === 'under-review') {
      return (
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={onApprove} 
            variant="default" 
            disabled={disabled || hasEarlierWeeksUnderReview}
            title={hasEarlierWeeksUnderReview ? "Earlier weeks need to be approved first" : "Approve timesheet"}
          >
            <Check className="h-4 w-4 mr-2" />
            {hasEarlierWeeksUnderReview ? "Earlier Weeks Pending" : "Approve"}
          </Button>
          <Button onClick={handleReject} variant="destructive" disabled={disabled}>
            <X className="h-4 w-4 mr-2" />
            Reject
          </Button>
          {hasEarlierWeeksUnderReview && onNavigateToFirstUnderReview && (
            <Button 
              onClick={onNavigateToFirstUnderReview}
              variant="outline"
              className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Go to First Week Under Review
            </Button>
          )}
        </div>
      );
    } else if (status === 'unconfirmed' || status === 'needs-revision') {
      return (
        <div className="flex gap-2">
          <Button onClick={onSubmitForReview} disabled={disabled}>
            <Send className="h-4 w-4 mr-2" />
            Submit for Review
          </Button>
          {onNavigateToFirstUnderReview && (
            <Button 
              onClick={onNavigateToFirstUnderReview}
              variant="outline"
              className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Go to First Week Under Review
            </Button>
          )}
        </div>
      );
    } else {
      return onNavigateToFirstUnderReview ? (
        <Button 
          onClick={onNavigateToFirstUnderReview}
          variant="outline"
          className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          Go to First Week Under Review
        </Button>
      ) : null;
    }
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
