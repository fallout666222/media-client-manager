import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { updateVersionStatus } from '@/integrations/supabase/database';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types/timesheet';

interface VersionStatus {
  id: string;
  name: string;
}

interface PlanningVersionStatusProps {
  currentUser: User;
  versionId: string;
  currentStatus?: string;
  isUserHead?: boolean;
  onStatusUpdate: () => void;
}

export function PlanningVersionStatus({
  currentUser,
  versionId,
  currentStatus = 'unconfirmed',
  isUserHead = false,
  onStatusUpdate
}: PlanningVersionStatusProps) {
  const { toast } = useToast();

  const fetchStatusId = async (statusName: string) => {
    try {
      // Use window.location.origin to ensure we have the full base URL
      const baseUrl = window.location.origin;
      const apiUrl = `${baseUrl}/api/statusId?name=${statusName}`;
      console.log('Fetching status ID from:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const responseText = await response.text();
      console.log('API response:', responseText);
      
      // Check if the response is valid JSON
      try {
        const responseData = JSON.parse(responseText);
        return responseData;
      } catch (jsonError) {
        console.error('Error parsing JSON:', responseText);
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error fetching status ID:', error);
      throw error;
    }
  };

  const handleSubmitForReview = async () => {
    try {
      // Get the 'under-review' status ID
      const { data: statusData, error: statusError } = await fetchStatusId('under-review');
      
      if (statusError) throw new Error(statusError.message || 'Failed to get status ID');
      if (!statusData?.id) throw new Error('Could not find under-review status');

      await updateVersionStatus(currentUser.id || '', versionId, statusData.id);
      onStatusUpdate();
      
      toast({
        title: 'Status Updated',
        description: 'Planning version submitted for review',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive'
      });
    }
  };
  
  const handleApprove = async () => {
    try {
      // Get the 'accepted' status ID
      const { data: statusData, error: statusError } = await fetchStatusId('accepted');
      
      if (statusError) throw new Error(statusError.message || 'Failed to get status ID');
      if (!statusData?.id) throw new Error('Could not find accepted status');

      await updateVersionStatus(currentUser.id || '', versionId, statusData.id);
      onStatusUpdate();
      
      toast({
        title: 'Version Approved',
        description: 'Planning version has been approved',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error approving version:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve version',
        variant: 'destructive'
      });
    }
  };
  
  const handleRequestRevision = async () => {
    try {
      // Get the 'needs-revision' status ID
      const { data: statusData, error: statusError } = await fetchStatusId('needs-revision');
      
      if (statusError) throw new Error(statusError.message || 'Failed to get status ID');
      if (!statusData?.id) throw new Error('Could not find needs-revision status');

      await updateVersionStatus(currentUser.id || '', versionId, statusData.id);
      onStatusUpdate();
      
      toast({
        title: 'Revision Requested',
        description: 'User will need to revise the planning version',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error requesting revision:', error);
      toast({
        title: 'Error',
        description: 'Failed to request revision',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'unconfirmed':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'under-review':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'needs-revision':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center">
        <span className="mr-2 text-sm text-gray-600">Status:</span>
        <Badge className={getStatusBadgeColor(currentStatus)}>
          {currentStatus === 'under-review' ? 'Under Review' : 
           currentStatus === 'needs-revision' ? 'Needs Revision' : 
           currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
        </Badge>
      </div>
      
      {/* Action buttons based on user's role and current status */}
      {!isUserHead && (currentStatus === 'unconfirmed' || currentStatus === 'needs-revision') && (
        <Button size="sm" onClick={handleSubmitForReview}>
          Submit for Review
        </Button>
      )}
      
      {isUserHead && currentStatus === 'under-review' && (
        <div className="flex gap-2">
          <Button size="sm" variant="default" onClick={handleApprove}>
            Approve
          </Button>
          <Button size="sm" variant="outline" onClick={handleRequestRevision}>
            Request Revision
          </Button>
        </div>
      )}
    </div>
  );
}
