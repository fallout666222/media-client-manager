
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPlanningVersions, getPlanningHours, updatePlanningHours } from '@/integrations/supabase/database';
import { useToast } from '@/hooks/use-toast';
import { PlanningVersion, PlanningHours, ClientHours, MonthData } from '@/types/planning';
import { Client } from '@/types/timesheet';

export const usePlanning = (userId: string) => {
  const { toast } = useToast();
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  
  // Fetch planning versions
  const {
    data: versionsData,
    isLoading: isLoadingVersions
  } = useQuery({
    queryKey: ['planning-versions'],
    queryFn: async () => {
      const { data, error } = await getPlanningVersions();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to load planning versions",
          variant: "destructive",
        });
        return [];
      }
      return data as PlanningVersion[];
    }
  });
  
  // Set default selected version
  useEffect(() => {
    if (versionsData && versionsData.length > 0 && !selectedVersionId) {
      setSelectedVersionId(versionsData[0].id);
    }
  }, [versionsData, selectedVersionId]);

  // Fetch planning hours for selected version
  const {
    data: planningHours = [],
    isLoading: isLoadingHours,
    refetch: refetchHours
  } = useQuery({
    queryKey: ['planning-hours', selectedVersionId, userId],
    queryFn: async () => {
      if (!selectedVersionId) return [];
      
      const { data, error } = await getPlanningHours(selectedVersionId, userId);
      if (error) {
        toast({
          title: "Error",
          description: "Failed to load planning hours",
          variant: "destructive",
        });
        return [];
      }
      return data as PlanningHours[];
    },
    enabled: !!selectedVersionId
  });

  const processClientHours = (hours: PlanningHours[], clients: Client[]): ClientHours[] => {
    // Create a Map to store hours by client
    const clientHoursMap = new Map<string, ClientHours>();
    
    // Initialize the map with all clients
    clients.forEach(client => {
      clientHoursMap.set(client.id, {
        client,
        months: {
          Jan: 0, Feb: 0, Mar: 0, Q1: 0,
          Apr: 0, May: 0, Jun: 0, Q2: 0,
          Jul: 0, Aug: 0, Sep: 0, Q3: 0,
          Oct: 0, Nov: 0, Dec: 0, Q4: 0,
          FY: 0
        }
      });
    });
    
    // Fill in hours data from the API response
    hours.forEach(hour => {
      if (!clientHoursMap.has(hour.client_id)) {
        // If client is not in our map (could happen if it's not in visible clients but has hours)
        if (hour.client) {
          clientHoursMap.set(hour.client_id, {
            client: hour.client,
            months: {
              Jan: 0, Feb: 0, Mar: 0, Q1: 0,
              Apr: 0, May: 0, Jun: 0, Q2: 0,
              Jul: 0, Aug: 0, Sep: 0, Q3: 0,
              Oct: 0, Nov: 0, Dec: 0, Q4: 0,
              FY: 0
            }
          });
        } else {
          // Skip if we don't have client info
          return;
        }
      }
      
      const clientHours = clientHoursMap.get(hour.client_id)!;
      
      // Update the specific month
      if (hour.month in clientHours.months) {
        clientHours.months[hour.month as keyof MonthData] = hour.hours;
      }
    });
    
    // Calculate quarter and yearly totals
    clientHoursMap.forEach(clientHour => {
      const m = clientHour.months;
      
      // Calculate quarter totals
      m.Q1 = m.Jan + m.Feb + m.Mar;
      m.Q2 = m.Apr + m.May + m.Jun;
      m.Q3 = m.Jul + m.Aug + m.Sep;
      m.Q4 = m.Oct + m.Nov + m.Dec;
      
      // Calculate fiscal year total
      m.FY = m.Q1 + m.Q2 + m.Q3 + m.Q4;
    });
    
    // Convert map to array and filter out clients with no hours
    return Array.from(clientHoursMap.values())
      .filter(clientHour => clientHour.months.FY > 0);
  };

  const updateHours = async (clientId: string, month: string, hours: number) => {
    if (!selectedVersionId) return;
    
    try {
      await updatePlanningHours(selectedVersionId, userId, clientId, month, hours);
      refetchHours();
      toast({
        title: "Success",
        description: "Hours updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update hours",
        variant: "destructive",
      });
    }
  };

  return {
    versions: versionsData || [],
    planningHours,
    isLoading: isLoadingVersions || isLoadingHours,
    selectedVersionId,
    setSelectedVersionId,
    processClientHours,
    updateHours
  };
};
