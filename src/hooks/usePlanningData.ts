import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  getPlanningVersions, 
  getPlanningHours, 
  getUserVisibleClients,
  getClients,
  getVersionStatus,
  getUserVersionsForApproval,
  getYearByName
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
  status?: string;
}

export interface ClientHours {
  clientId: string;
  clientName: string;
  months: Record<MonthName, number>;
  quarters: Record<string, number>;
  total: number;
}

export interface MonthlyLimits {
  Jan?: number;
  Feb?: number;
  Mar?: number;
  Apr?: number;
  May?: number;
  Jun?: number;
  Jul?: number;
  Aug?: number;
  Sep?: number;
  Oct?: number;
  Nov?: number;
  Dec?: number;
  totalLimit: number;
}

interface UsePlanningDataProps {
  currentUser: User;
  isUserHead?: boolean;
}

const LOCAL_STORAGE_KEY = 'selectedPlanningVersionId';

export const usePlanningData = ({ currentUser, isUserHead = false }: UsePlanningDataProps) => {
  const [versions, setVersions] = useState<PlanningVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    localStorage.getItem(LOCAL_STORAGE_KEY) || null
  );
  const [planningData, setPlanningData] = useState<ClientHours[]>([]);
  const [visibleClients, setVisibleClients] = useState<string[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [versionStatus, setVersionStatus] = useState<string>('unconfirmed');
  const [userVersionsForApproval, setUserVersionsForApproval] = useState<any[]>([]);
  const [monthlyLimits, setMonthlyLimits] = useState<MonthlyLimits>({ totalLimit: 0 });
  const [totalPlannedHours, setTotalPlannedHours] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedVersionId) {
      localStorage.setItem(LOCAL_STORAGE_KEY, selectedVersionId);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [selectedVersionId]);

  const handleSetSelectedVersionId = useCallback((versionId: string) => {
    setSelectedVersionId(versionId);
  }, []);

  const reloadPlanningData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const { data, error } = await getPlanningVersions();
        if (error) throw error;
        
        if (data && data.length > 0) {
          const versionsWithStatus = await Promise.all(
            data.map(async (version) => {
              if (currentUser.id) {
                const { data: statusData } = await getVersionStatus(currentUser.id, version.id);
                return {
                  ...version,
                  status: statusData?.status?.name || 'unconfirmed'
                };
              }
              return { ...version, status: 'unconfirmed' };
            })
          );
          
          setVersions(versionsWithStatus);
          
          if (!selectedVersionId) {
            setSelectedVersionId(data[0].id);
          } else {
            const versionExists = data.some(version => version.id === selectedVersionId);
            if (!versionExists && data.length > 0) {
              setSelectedVersionId(data[0].id);
            }
          }
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
  }, [toast, selectedVersionId, currentUser.id, refreshTrigger]);

  useEffect(() => {
    const fetchVersionStatus = async () => {
      if (currentUser.id && selectedVersionId) {
        try {
          const { data, error } = await getVersionStatus(currentUser.id, selectedVersionId);
          if (error) throw error;
          
          setVersionStatus(data?.status?.name || 'unconfirmed');
        } catch (error) {
          console.error('Error fetching version status:', error);
          setVersionStatus('unconfirmed');
        }
      }
    };
    
    fetchVersionStatus();
  }, [currentUser.id, selectedVersionId, refreshTrigger]);

  useEffect(() => {
    const fetchVersionsForApproval = async () => {
      if (isUserHead && currentUser.id) {
        try {
          const { data, error } = await getUserVersionsForApproval(currentUser.id);
          if (error) throw error;
          
          if (data) {
            setUserVersionsForApproval(data);
          }
        } catch (error) {
          console.error('Error fetching versions for approval:', error);
        }
      }
    };
    
    fetchVersionsForApproval();
  }, [isUserHead, currentUser.id, refreshTrigger]);

  useEffect(() => {
    const fetchClientsData = async () => {
      try {
        const { data: clientsData, error: clientsError } = await getClients();
        if (clientsError) throw clientsError;
        if (clientsData) {
          setAllClients(clientsData);
        }

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

  useEffect(() => {
    const fetchYearLimits = async () => {
      const selectedVersion = versions.find(v => v.id === selectedVersionId);
      if (selectedVersion) {
        try {
          const { data, error } = await getYearByName(selectedVersion.year);
          
          if (error) {
            console.error('Error fetching year data:', error);
            return;
          }
          
          if (data) {
            const totalLimit = MONTHS.reduce((sum, month) => sum + (data[month.toLowerCase()] || 0), 0);
            
            setMonthlyLimits({
              Jan: data.jan,
              Feb: data.feb,
              Mar: data.mar,
              Apr: data.apr,
              May: data.may,
              Jun: data.jun,
              Jul: data.jul,
              Aug: data.aug,
              Sep: data.sep,
              Oct: data.oct,
              Nov: data.nov,
              Dec: data.dec,
              totalLimit
            });
          }
        } catch (error) {
          console.error('Error fetching year limits:', error);
        }
      }
    };
    
    if (selectedVersionId && versions.length > 0) {
      fetchYearLimits();
    }
  }, [selectedVersionId, versions]);

  useEffect(() => {
    const fetchPlanningData = async () => {
      if (currentUser.id && selectedVersionId && allClients.length > 0) {
        try {
          const { data, error } = await getPlanningHours(currentUser.id, selectedVersionId);
          if (error) throw error;
          
          const clientsMap = new Map<string, ClientHours>();
          
          allClients.filter(client => !client.hidden).forEach(client => {
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
          
          data?.forEach(entry => {
            const clientId = entry.client_id;
            const clientName = entry.client?.name || 'Unknown Client';
            
            if (!clientsMap.has(clientId)) {
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
            
            const client = clientsMap.get(clientId)!;
            const month = entry.month as MonthName;
            if (MONTHS.includes(month)) {
              client.months[month] = Number(entry.hours) || 0;
            }
          });
          
          clientsMap.forEach(client => {
            QUARTERS.forEach(quarter => {
              client.quarters[quarter.name] = quarter.months.reduce(
                (sum, month) => sum + client.months[month], 0
              );
            });
            
            client.total = MONTHS.reduce((sum, month) => sum + client.months[month], 0);
          });
          
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

  useEffect(() => {
    const total = planningData.reduce((sum, client) => {
      return sum + client.total;
    }, 0);
    setTotalPlannedHours(total);
  }, [planningData]);

  return {
    versions,
    selectedVersionId,
    setSelectedVersionId: handleSetSelectedVersionId,
    planningData,
    visibleClients,
    allClients,
    months: MONTHS,
    quarters: QUARTERS,
    reloadPlanningData,
    versionStatus,
    userVersionsForApproval,
    isUserHead,
    monthlyLimits,
    totalPlannedHours
  };
};
