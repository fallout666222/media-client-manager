
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  getPlanningVersions, 
  getPlanningHours, 
  getUserVisibleClients,
  getClients
} from '@/integrations/supabase/database';
import { User, Client } from '@/types/timesheet';

type MonthName = 'Jan' | 'Feb' | 'Mar' | 'Apr' | 'May' | 'Jun' | 'Jul' | 'Aug' | 'Sep' | 'Oct' | 'Nov' | 'Dec';
const MONTHS: MonthName[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface Quarter {
  name: string;
  months: MonthName[];
}

export const QUARTERS: Quarter[] = [
  { name: 'Q1', months: ['Jan', 'Feb', 'Mar'] },
  { name: 'Q2', months: ['Apr', 'May', 'Jun'] },
  { name: 'Q3', months: ['Jul', 'Aug', 'Sep'] },
  { name: 'Q4', months: ['Oct', 'Nov', 'Dec'] }
];

export interface PlanningVersion {
  id: string;
  name: string;
  year: string;
  q1_locked: boolean;
  q2_locked: boolean;
  q3_locked: boolean;
  q4_locked: boolean;
}

export interface ClientHours {
  clientId: string;
  clientName: string;
  months: Record<MonthName, number>;
  quarters: Record<string, number>;
  total: number;
}

interface UsePlanningDataProps {
  currentUser: User;
}

export const usePlanningData = ({ currentUser }: UsePlanningDataProps) => {
  const [versions, setVersions] = useState<PlanningVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [planningData, setPlanningData] = useState<ClientHours[]>([]);
  const [visibleClients, setVisibleClients] = useState<string[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();

  // Function to reload planning data
  const reloadPlanningData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Load planning versions
  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const { data, error } = await getPlanningVersions();
        if (error) throw error;
        
        if (data && data.length > 0) {
          setVersions(data);
          setSelectedVersionId(data[0].id); // Select first version by default
        }
      } catch (error) {
        console.error('Error loading planning versions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load planning versions',
          variant: 'destructive'
        });
      }
    };
    
    fetchVersions();
  }, [toast]);

  // Load all clients and user visible clients
  useEffect(() => {
    const fetchClientsData = async () => {
      try {
        // Get all clients
        const { data: clientsData, error: clientsError } = await getClients();
        if (clientsError) throw clientsError;
        if (clientsData) {
          setAllClients(clientsData);
        }

        // Get user visible clients
        if (currentUser.id) {
          const { data: visibleClientsData, error: visibleError } = await getUserVisibleClients(currentUser.id);
          if (visibleError) throw visibleError;
          
          if (visibleClientsData) {
            const clientNames = visibleClientsData.map(vc => vc.client.name);
            setVisibleClients(clientNames);
          }
        }
      } catch (error) {
        console.error('Error fetching clients data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load clients data',
          variant: 'destructive'
        });
      }
    };
    
    fetchClientsData();
  }, [currentUser.id, toast]);

  // Load planning data
  useEffect(() => {
    const fetchPlanningData = async () => {
      if (currentUser.id && selectedVersionId && allClients.length > 0) {
        try {
          const { data, error } = await getPlanningHours(currentUser.id, selectedVersionId);
          if (error) throw error;
          
          // Process data
          const clientsMap = new Map<string, ClientHours>();
          
          // Pre-populate with all non-hidden clients from the database
          allClients.filter(client => !client.hidden).forEach(client => {
            // Initialize new client with zero values
            const emptyMonths: Record<MonthName, number> = {} as Record<MonthName, number>;
            MONTHS.forEach(month => { emptyMonths[month] = 0; });
            
            const emptyQuarters: Record<string, number> = {};
            QUARTERS.forEach(q => { emptyQuarters[q.name] = 0; });
            
            clientsMap.set(client.id, {
              clientId: client.id,
              clientName: client.name,
              months: emptyMonths,
              quarters: emptyQuarters,
              total: 0
            });
          });
          
          // Update with actual hours data
          data?.forEach(entry => {
            const clientId = entry.client_id;
            const clientName = entry.client?.name || 'Unknown Client';
            
            if (!clientsMap.has(clientId)) {
              // Initialize new client with zero values if not already in the map
              const emptyMonths: Record<MonthName, number> = {} as Record<MonthName, number>;
              MONTHS.forEach(month => { emptyMonths[month] = 0; });
              
              const emptyQuarters: Record<string, number> = {};
              QUARTERS.forEach(q => { emptyQuarters[q.name] = 0; });
              
              clientsMap.set(clientId, {
                clientId,
                clientName,
                months: emptyMonths,
                quarters: emptyQuarters,
                total: 0
              });
            }
            
            // Update hours for this month
            const client = clientsMap.get(clientId)!;
            const month = entry.month as MonthName;
            if (MONTHS.includes(month)) {
              client.months[month] = Number(entry.hours) || 0;
            }
          });
          
          // Calculate quarter totals and yearly total
          clientsMap.forEach(client => {
            QUARTERS.forEach(quarter => {
              client.quarters[quarter.name] = quarter.months.reduce(
                (sum, month) => sum + client.months[month], 0
              );
            });
            
            client.total = MONTHS.reduce((sum, month) => sum + client.months[month], 0);
          });
          
          // Convert map to array and sort by client name
          const processedData = Array.from(clientsMap.values())
            .sort((a, b) => a.clientName.localeCompare(b.clientName));
          
          setPlanningData(processedData);
        } catch (error) {
          console.error('Error loading planning data:', error);
          toast({
            title: 'Error',
            description: 'Failed to load planning data',
            variant: 'destructive'
          });
        }
      }
    };
    
    fetchPlanningData();
  }, [currentUser.id, selectedVersionId, allClients, toast, refreshTrigger]);

  return {
    versions,
    selectedVersionId,
    setSelectedVersionId,
    planningData,
    visibleClients,
    allClients,
    months: MONTHS,
    quarters: QUARTERS,
    reloadPlanningData
  };
};
