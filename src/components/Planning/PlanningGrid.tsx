
import React, { useState, useEffect } from 'react';
import { Client, User } from '@/types/timesheet';
import { useToast } from '@/hooks/use-toast';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getPlanningHours, updatePlanningHours } from '@/integrations/supabase/database';

// Define months and quarters
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const quarters = [
  { name: 'Q1', months: ['Jan', 'Feb', 'Mar'] },
  { name: 'Q2', months: ['Apr', 'May', 'Jun'] },
  { name: 'Q3', months: ['Jul', 'Aug', 'Sep'] },
  { name: 'Q4', months: ['Oct', 'Nov', 'Dec'] },
];

type PlanningData = {
  [clientId: string]: {
    clientName: string;
    months: {
      [month: string]: number;
    };
    quarters: {
      [quarter: string]: number;
    };
    total: number;
  };
};

interface PlanningGridProps {
  currentUser: User;
  versionId: string;
  clients: Client[];
  visibleClientIds?: string[];
  isLocked?: {
    q1: boolean;
    q2: boolean;
    q3: boolean;
    q4: boolean;
  };
}

export function PlanningGrid({ 
  currentUser, 
  versionId, 
  clients,
  visibleClientIds = [],
  isLocked = { q1: false, q2: false, q3: false, q4: false }
}: PlanningGridProps) {
  const { toast } = useToast();
  const [planningData, setPlanningData] = useState<PlanningData>({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Helper to check if month is in a locked quarter
  const isMonthLocked = (month: string): boolean => {
    if (month === 'Jan' || month === 'Feb' || month === 'Mar') return isLocked.q1;
    if (month === 'Apr' || month === 'May' || month === 'Jun') return isLocked.q2;
    if (month === 'Jul' || month === 'Aug' || month === 'Sep') return isLocked.q3;
    if (month === 'Oct' || month === 'Nov' || month === 'Dec') return isLocked.q4;
    return false;
  };
  
  // Helper to check if quarter is locked
  const isQuarterLocked = (quarter: string): boolean => {
    if (quarter === 'Q1') return isLocked.q1;
    if (quarter === 'Q2') return isLocked.q2;
    if (quarter === 'Q3') return isLocked.q3;
    if (quarter === 'Q4') return isLocked.q4;
    return false;
  };

  // Fetch planning data
  const fetchPlanningData = async () => {
    if (!currentUser.id || !versionId) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await getPlanningHours(currentUser.id, versionId);
      
      if (error) {
        throw error;
      }
      
      // Initialize planning data structure
      const newPlanningData: PlanningData = {};
      
      // Initialize with all clients from props
      clients.forEach(client => {
        // Skip hidden clients unless they're in the visible list
        if ((client.hidden && !visibleClientIds.includes(client.id)) && 
            (!data || !data.some(entry => entry.client_id === client.id))) {
          return;
        }
        
        newPlanningData[client.id] = {
          clientName: client.name,
          months: months.reduce((acc, month) => ({ ...acc, [month]: 0 }), {}),
          quarters: quarters.reduce((acc, q) => ({ ...acc, [q.name]: 0 }), {}),
          total: 0
        };
      });
      
      // Fill in data from API response
      if (data) {
        data.forEach(entry => {
          const clientId = entry.client_id;
          const month = entry.month;
          const hours = Number(entry.hours) || 0;
          
          // If this client isn't in our data yet (could be a hidden client with data)
          if (!newPlanningData[clientId]) {
            const clientInfo = entry.client || { name: 'Unknown Client' };
            newPlanningData[clientId] = {
              clientName: clientInfo.name,
              months: months.reduce((acc, m) => ({ ...acc, [m]: 0 }), {}),
              quarters: quarters.reduce((acc, q) => ({ ...acc, [q.name]: 0 }), {}),
              total: 0
            };
          }
          
          // Update month data
          newPlanningData[clientId].months[month] = hours;
          
          // Update quarter and total
          quarters.forEach(quarter => {
            if (quarter.months.includes(month)) {
              newPlanningData[clientId].quarters[quarter.name] += hours;
              newPlanningData[clientId].total += hours;
            }
          });
        });
      }
      
      setPlanningData(newPlanningData);
    } catch (error) {
      console.error('Error fetching planning data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load planning data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial load
  useEffect(() => {
    fetchPlanningData();
  }, [currentUser.id, versionId]);
  
  // Handle hour input changes
  const handleHoursChange = async (clientId: string, month: string, hours: number) => {
    if (isMonthLocked(month)) {
      toast({
        title: "Quarter Locked",
        description: `This quarter is locked and cannot be edited.`,
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Update local state immediately for better UX
      const updatedPlanningData = { ...planningData };
      const oldHours = updatedPlanningData[clientId].months[month] || 0;
      const difference = hours - oldHours;
      
      // Update month hours
      updatedPlanningData[clientId].months[month] = hours;
      
      // Update quarter totals and overall total
      quarters.forEach(quarter => {
        if (quarter.months.includes(month)) {
          updatedPlanningData[clientId].quarters[quarter.name] += difference;
          updatedPlanningData[clientId].total += difference;
        }
      });
      
      setPlanningData(updatedPlanningData);
      
      // Update in database
      if (currentUser.id) {
        await updatePlanningHours(currentUser.id, versionId, clientId, month, hours);
      }
    } catch (error) {
      console.error('Error updating hours:', error);
      toast({
        title: 'Error',
        description: 'Failed to update planning hours',
        variant: 'destructive'
      });
      
      // Revert changes on error
      fetchPlanningData();
    }
  };
  
  if (isLoading) {
    return <div className="text-center p-8">Loading planning data...</div>;
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Monthly Planning</CardTitle>
        <CardDescription>
          Enter your planned hours for each client by month
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px] sticky left-0 bg-background z-10">Client</TableHead>
              {months.slice(0, 3).map(month => (
                <TableHead key={month} className={isMonthLocked(month) ? 'bg-muted/30' : ''}>
                  {month}
                </TableHead>
              ))}
              <TableHead className={isQuarterLocked('Q1') ? 'bg-muted/50 font-bold' : 'font-bold'}>Q1</TableHead>
              
              {months.slice(3, 6).map(month => (
                <TableHead key={month} className={isMonthLocked(month) ? 'bg-muted/30' : ''}>
                  {month}
                </TableHead>
              ))}
              <TableHead className={isQuarterLocked('Q2') ? 'bg-muted/50 font-bold' : 'font-bold'}>Q2</TableHead>
              
              {months.slice(6, 9).map(month => (
                <TableHead key={month} className={isMonthLocked(month) ? 'bg-muted/30' : ''}>
                  {month}
                </TableHead>
              ))}
              <TableHead className={isQuarterLocked('Q3') ? 'bg-muted/50 font-bold' : 'font-bold'}>Q3</TableHead>
              
              {months.slice(9, 12).map(month => (
                <TableHead key={month} className={isMonthLocked(month) ? 'bg-muted/30' : ''}>
                  {month}
                </TableHead>
              ))}
              <TableHead className={isQuarterLocked('Q4') ? 'bg-muted/50 font-bold' : 'font-bold'}>Q4</TableHead>
              
              <TableHead className="font-bold">FY</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(planningData).map(([clientId, data]) => (
              <TableRow key={clientId}>
                <TableCell className="font-medium sticky left-0 bg-background z-10">
                  {data.clientName}
                </TableCell>
                
                {/* Q1 Months */}
                {months.slice(0, 3).map(month => (
                  <TableCell key={month} className={isMonthLocked(month) ? 'bg-muted/30' : ''}>
                    {isMonthLocked(month) ? (
                      <span>{data.months[month] || 0}</span>
                    ) : (
                      <Input
                        type="number"
                        min="0"
                        value={data.months[month] || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          handleHoursChange(clientId, month, value);
                        }}
                        className="w-16 h-8"
                      />
                    )}
                  </TableCell>
                ))}
                <TableCell className={`font-bold ${isQuarterLocked('Q1') ? 'bg-muted/50' : ''}`}>
                  {data.quarters.Q1 || 0}
                </TableCell>
                
                {/* Q2 Months */}
                {months.slice(3, 6).map(month => (
                  <TableCell key={month} className={isMonthLocked(month) ? 'bg-muted/30' : ''}>
                    {isMonthLocked(month) ? (
                      <span>{data.months[month] || 0}</span>
                    ) : (
                      <Input
                        type="number"
                        min="0"
                        value={data.months[month] || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          handleHoursChange(clientId, month, value);
                        }}
                        className="w-16 h-8"
                      />
                    )}
                  </TableCell>
                ))}
                <TableCell className={`font-bold ${isQuarterLocked('Q2') ? 'bg-muted/50' : ''}`}>
                  {data.quarters.Q2 || 0}
                </TableCell>
                
                {/* Q3 Months */}
                {months.slice(6, 9).map(month => (
                  <TableCell key={month} className={isMonthLocked(month) ? 'bg-muted/30' : ''}>
                    {isMonthLocked(month) ? (
                      <span>{data.months[month] || 0}</span>
                    ) : (
                      <Input
                        type="number"
                        min="0"
                        value={data.months[month] || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          handleHoursChange(clientId, month, value);
                        }}
                        className="w-16 h-8"
                      />
                    )}
                  </TableCell>
                ))}
                <TableCell className={`font-bold ${isQuarterLocked('Q3') ? 'bg-muted/50' : ''}`}>
                  {data.quarters.Q3 || 0}
                </TableCell>
                
                {/* Q4 Months */}
                {months.slice(9, 12).map(month => (
                  <TableCell key={month} className={isMonthLocked(month) ? 'bg-muted/30' : ''}>
                    {isMonthLocked(month) ? (
                      <span>{data.months[month] || 0}</span>
                    ) : (
                      <Input
                        type="number"
                        min="0"
                        value={data.months[month] || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          handleHoursChange(clientId, month, value);
                        }}
                        className="w-16 h-8"
                      />
                    )}
                  </TableCell>
                ))}
                <TableCell className={`font-bold ${isQuarterLocked('Q4') ? 'bg-muted/50' : ''}`}>
                  {data.quarters.Q4 || 0}
                </TableCell>
                
                {/* Full Year Total */}
                <TableCell className="font-bold">
                  {data.total || 0}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
