import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { usePlanningData, QUARTERS } from '@/hooks/usePlanningData';
import { PlanningHoursCell } from '@/components/Planning/PlanningHoursCell';
import { User, Client } from '@/types/timesheet';

interface PlanningProps {
  currentUser: User;
  clients: Client[];
}

export default function Planning({ currentUser, clients }: PlanningProps) {
  const { 
    versions, 
    selectedVersionId, 
    setSelectedVersionId, 
    planningData, 
    visibleClients,
    months,
    quarters
  } = usePlanningData({ currentUser });
  
  // Filter clients to show according to visibility rules and existing data
  const [filteredClients, setFilteredClients] = useState(planningData);
  
  useEffect(() => {
    // If a client has hours recorded for any month, include it
    // Otherwise, only include it if it's in the user's visible clients
    const filtered = planningData.filter(client => {
      const hasHours = Object.values(client.months).some(hours => hours > 0);
      const isVisible = visibleClients.includes(client.clientName);
      
      return hasHours || isVisible;
    });
    
    setFilteredClients(filtered);
  }, [planningData, visibleClients]);
  
  // Find selected version
  const selectedVersion = versions.find(v => v.id === selectedVersionId);
  
  // Determine which quarters are locked
  const isQuarterLocked = (quarter: string) => {
    if (!selectedVersion) return false;
    
    switch (quarter) {
      case 'Q1': return selectedVersion.q1_locked;
      case 'Q2': return selectedVersion.q2_locked;
      case 'Q3': return selectedVersion.q3_locked;
      case 'Q4': return selectedVersion.q4_locked;
      default: return false;
    }
  };
  
  // Determine if a specific month is locked
  const isMonthLocked = (month: string) => {
    const quarter = QUARTERS.find(q => q.months.includes(month as any));
    if (!quarter) return false;
    
    return isQuarterLocked(quarter.name);
  };

  return (
    <div className="container mx-auto p-4 pt-16">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Planning</h1>
        <Link to="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      
      <div className="mb-6">
        <div className="max-w-xs">
          <label htmlFor="version-select" className="block text-sm font-medium mb-1">
            Select Planning Version
          </label>
          <Select
            value={selectedVersionId || ''}
            onValueChange={(value) => setSelectedVersionId(value)}
          >
            <SelectTrigger id="version-select" className="w-full">
              <SelectValue placeholder="Select a version" />
            </SelectTrigger>
            <SelectContent>
              {versions.map((version) => (
                <SelectItem key={version.id} value={version.id}>
                  {version.name} ({version.year})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="overflow-x-auto border rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-gray-50 font-bold sticky left-0 z-10">Client</TableHead>
              
              {/* Q1 */}
              <TableHead className="bg-gray-50 text-center">Jan</TableHead>
              <TableHead className="bg-gray-50 text-center">Feb</TableHead>
              <TableHead className="bg-gray-50 text-center">Mar</TableHead>
              <TableHead className="bg-gray-100 text-center font-bold">Q1</TableHead>
              
              {/* Q2 */}
              <TableHead className="bg-gray-50 text-center">Apr</TableHead>
              <TableHead className="bg-gray-50 text-center">May</TableHead>
              <TableHead className="bg-gray-50 text-center">Jun</TableHead>
              <TableHead className="bg-gray-100 text-center font-bold">Q2</TableHead>
              
              {/* Q3 */}
              <TableHead className="bg-gray-50 text-center">Jul</TableHead>
              <TableHead className="bg-gray-50 text-center">Aug</TableHead>
              <TableHead className="bg-gray-50 text-center">Sep</TableHead>
              <TableHead className="bg-gray-100 text-center font-bold">Q3</TableHead>
              
              {/* Q4 */}
              <TableHead className="bg-gray-50 text-center">Oct</TableHead>
              <TableHead className="bg-gray-50 text-center">Nov</TableHead>
              <TableHead className="bg-gray-50 text-center">Dec</TableHead>
              <TableHead className="bg-gray-100 text-center font-bold">Q4</TableHead>
              
              {/* Total */}
              <TableHead className="bg-blue-100 text-center font-bold">FY</TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <TableRow key={client.clientId}>
                  <TableCell className="font-medium bg-white sticky left-0 z-10">
                    {client.clientName}
                  </TableCell>
                  
                  {/* Monthly entries */}
                  {months.map((month) => (
                    <TableCell key={month} className="p-0">
                      <PlanningHoursCell
                        userId={currentUser.id || ''}
                        versionId={selectedVersionId || ''}
                        clientId={client.clientId}
                        month={month}
                        initialValue={client.months[month]}
                        isLocked={isMonthLocked(month)}
                      />
                    </TableCell>
                  ))}
                  
                  {/* Quarter totals */}
                  {quarters.map((quarter) => (
                    <TableCell key={quarter.name} className="bg-gray-100 text-center font-medium">
                      {client.quarters[quarter.name] > 0 ? client.quarters[quarter.name] : '-'}
                    </TableCell>
                  ))}
                  
                  {/* Year total */}
                  <TableCell className="bg-blue-100 text-center font-bold">
                    {client.total > 0 ? client.total : '-'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={18} className="text-center py-8 text-gray-500">
                  No planning data available. Double-click on a cell to add hours.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
