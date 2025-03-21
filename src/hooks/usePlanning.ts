
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { 
  getPlanningVersions,
  getPlanningVersion,
  createPlanningVersion,
  updatePlanningVersionLocks,
  fillActualHours
} from '@/integrations/supabase/database';

interface PlanningVersion {
  id: string;
  name: string;
  year: string;
  q1_locked: boolean;
  q2_locked: boolean;
  q3_locked: boolean;
  q4_locked: boolean;
  created_at?: string;
}

export const usePlanning = () => {
  const { toast } = useToast();
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  
  // Get all planning versions
  const { data: versions = [], isLoading: versionsLoading, refetch: refetchVersions } = useQuery({
    queryKey: ['planning-versions'],
    queryFn: async () => {
      const { data, error } = await getPlanningVersions();
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to load planning versions',
          variant: 'destructive'
        });
        return [];
      }
      return data || [];
    }
  });
  
  // Get selected version details
  const { data: selectedVersion, isLoading: versionLoading, refetch: refetchSelectedVersion } = useQuery({
    queryKey: ['planning-version', selectedVersionId],
    queryFn: async () => {
      if (!selectedVersionId) return null;
      
      const { data, error } = await getPlanningVersion(selectedVersionId);
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to load version details',
          variant: 'destructive'
        });
        return null;
      }
      return data;
    },
    enabled: !!selectedVersionId
  });
  
  // Set initial selected version
  useEffect(() => {
    if (versions.length > 0 && !selectedVersionId) {
      setSelectedVersionId(versions[0].id);
    }
  }, [versions, selectedVersionId]);
  
  // Create a new version
  const createVersion = async (name: string, year: string) => {
    try {
      const { data, error } = await createPlanningVersion(name, year);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Planning version created successfully',
      });
      
      await refetchVersions();
      
      return data;
    } catch (error) {
      console.error('Error creating planning version:', error);
      toast({
        title: 'Error',
        description: 'Failed to create planning version',
        variant: 'destructive'
      });
      return null;
    }
  };
  
  // Update quarter locks
  const updateQuarterLocks = async (
    versionId: string,
    q1Locked: boolean,
    q2Locked: boolean,
    q3Locked: boolean,
    q4Locked: boolean
  ) => {
    try {
      const { data, error } = await updatePlanningVersionLocks(
        versionId,
        q1Locked,
        q2Locked,
        q3Locked,
        q4Locked
      );
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Quarter lock status updated successfully',
      });
      
      await refetchSelectedVersion();
      
      return data;
    } catch (error) {
      console.error('Error updating quarter locks:', error);
      toast({
        title: 'Error',
        description: 'Failed to update quarter locks',
        variant: 'destructive'
      });
      return null;
    }
  };
  
  // Fill actual hours for locked quarters
  const fillActual = async (versionId: string, year: string) => {
    try {
      const result = await fillActualHours(versionId, year);
      
      if (!result.success) throw new Error('Failed to fill actual hours');
      
      toast({
        title: 'Success',
        description: 'Actual hours filled successfully for locked quarters',
      });
      
      return true;
    } catch (error) {
      console.error('Error filling actual hours:', error);
      toast({
        title: 'Error',
        description: 'Failed to fill actual hours',
        variant: 'destructive'
      });
      return false;
    }
  };
  
  return {
    versions,
    versionsLoading,
    selectedVersion,
    versionLoading,
    selectedVersionId,
    setSelectedVersionId,
    createVersion,
    updateQuarterLocks,
    fillActual,
    refetchVersions
  };
};
