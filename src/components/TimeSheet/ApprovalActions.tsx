import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, ChevronLeft, Send, RotateCcw } from 'lucide-react';
import { TimeSheetStatus } from '@/types/timesheet';
import { useToast } from '@/hooks/use-toast';

interface ApprovalActionsProps {
  status: TimeSheetStatus;
  isManager: boolean;
  isViewingOwnTimesheet: boolean;
  onSubmitForReview: () => void;
  onApprove: () => void;
  onReject: () => void;
  onReturnToUnconfirmed?: () => void;
  disabled?: boolean;
  weekId?: string;
  adminOverride?: boolean;
  isUserHead?: boolean;
  hasEarlierWeeksUnderReview?: boolean;
  onNavigateToFirstUnderReview?: () => void;
}

export const ApprovalActions: React.FC<ApprovalActionsProps> = ({
  status,
  isManager,
  isViewingOwnTimesheet,
  onSubmitForReview,
  onApprove,
  onReject,
  onReturnToUnconfirmed,
  disabled = false,
  weekId,
  adminOverride = false,
  isUserHead = false,
  hasEarlierWeeksUnderReview = false,
  onNavigateToFirstUnderReview
}) => {
  const { toast } = useToast();

  const showAdminWarning = () => {
    toast({
      title: 'Admin Override Active',
      description: 'You are making changes with admin override. Use caution.',
      variant: 'destructive',
    });
  };

  const handleSubmit = () => {
    if (adminOverride) showAdminWarning();
    onSubmitForReview();
  };

  const handleApprove = () => {
    if (adminOverride) showAdminWarning();
    onApprove();
  };

  const handleReject = () => {
    if (adminOverride) showAdminWarning();
    onReject();
  };

  const handleReturnToUnconfirmed = () => {
    if (adminOverride && onReturnToUnconfirmed) {
      showAdminWarning();
      onReturnToUnconfirmed();
    }
  };

  const renderUserHead = () => {
    if (!isUserHead || !hasEarlierWeeksUnderReview || !onNavigateToFirstUnderReview) {
      return null;
    }

    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={onNavigateToFirstUnderReview}
        className="flex items-center gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        Go to First Week Under Review
      </Button>
    );
  };

  const renderUserControls = () => {
    if (!isViewingOwnTimesheet && !adminOverride && !isUserHead) return null;

    if (status === 'unconfirmed' || status === 'needs-revision') {
      return (
        <Button
          onClick={handleSubmit}
          size="sm"
          className="flex items-center gap-1"
          disabled={disabled}
        >
          <Send className="h-4 w-4" />
          Submit for Review
        </Button>
      );
    }
    return null;
  };

  const renderManagerControls = () => {
    if (
      status !== 'under-review' ||
      ((!isManager && !adminOverride && !isUserHead) || 
      (isViewingOwnTimesheet && !adminOverride))
    ) {
      return null;
    }

    return (
      <div className="flex gap-2">
        <Button
          onClick={handleApprove}
          variant="default"
          size="sm"
          className="flex items-center gap-1"
          disabled={disabled}
        >
          <CheckCircle className="h-4 w-4" />
          Approve
        </Button>
        <Button
          onClick={handleReject}
          variant="destructive"
          size="sm"
          className="flex items-center gap-1"
          disabled={disabled}
        >
          <AlertCircle className="h-4 w-4" />
          Request Revision
        </Button>
      </div>
    );
  };

  const renderAdminOverrideControls = () => {
    if (!adminOverride || status !== 'accepted' || !onReturnToUnconfirmed) {
      return null;
    }

    return (
      <Button
        onClick={handleReturnToUnconfirmed}
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
        disabled={disabled}
      >
        <RotateCcw className="h-4 w-4" />
        Return to Unconfirmed
      </Button>
    );
  };

  return (
    <div className="flex items-center gap-2">
      {renderUserHead()}
      {renderUserControls()}
      {renderManagerControls()}
      {renderAdminOverrideControls()}
    </div>
  );
};
