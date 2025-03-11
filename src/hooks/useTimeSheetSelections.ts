
import { useState, useEffect } from 'react';
import { User } from '@/types/timesheet';
import { getUserVisibleClients, getUserVisibleTypes } from '@/integrations/supabase/database';

interface UseTimeSheetSelectionsProps {
  currentUser: User;
}

export const useTimeSheetSelections = ({
  currentUser
}: UseTimeSheetSelectionsProps) => {
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedMediaTypes, setSelectedMediaTypes] = useState<string[]>([]);

  // Load user visible clients and types
  useEffect(() => {
    const fetchUserVisibles = async () => {
      if (currentUser.id) {
        try {
          const { data: visibleClientsData } = await getUserVisibleClients(currentUser.id);
          if (visibleClientsData) {
            const clientNames = visibleClientsData.map(vc => vc.client.name);
            setSelectedClients(clientNames);
          }
          
          const { data: visibleTypesData } = await getUserVisibleTypes(currentUser.id);
          if (visibleTypesData) {
            const typeNames = visibleTypesData.map(vt => vt.type.name);
            setSelectedMediaTypes(typeNames);
          }
        } catch (error) {
          console.error('Error fetching user visibles:', error);
        }
      }
    };
    
    fetchUserVisibles();
  }, [currentUser.id]);

  return {
    selectedClients,
    setSelectedClients,
    selectedMediaTypes,
    setSelectedMediaTypes
  };
};
