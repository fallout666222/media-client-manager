
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Settings } from 'lucide-react';
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
    reloadPlanningData,
    visibleClients,
    months,
    quarters
  } = usePlanningData({ currentUser });
  
  const [filteredClients, setFilteredClients] = useState(planningData);
  
  useEffect(() => {
    // Show clients that:
    // 1. Either have hours recorded (planningData with non-zero hours)
    // 2. Or are in the user's visible clients list
    const filtered = planningData.filter(client => {
      const hasHours = Object.values(client.months).some(hours => hours > 0);
      const isVisible = visibleClients.includes(client.clientName);
      
      return hasHours || isVisible;
    });
    
    setFilteredClients(filtered);
  }, [planningData, visibleClients]);
  
  const selectedVersion = versions.find(v => v.id === selectedVersionId);
  
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
  
  const isMonthLocked = (month: string) => {
    const quarter = QUARTERS.find(q => q.months.includes(month as any));
    if (!quarter) return false;
    
    return isQuarterLocked(quarter.name);
  };

  const handleCellUpdate = useCallback(() => {
    // Trigger reload of planning data
    if (reloadPlanningData) {
      reloadPlanningData();
    }
  }, [reloadPlanningData]);

  return (
    <div className="container mx-auto p-4 pt-16">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Planning</h1>
        <div className="flex gap-2">
          {currentUser.type === 'admin' && (
            <Link to="/planning-management">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Manage Versions
              </Button>
            </Link>
          )}
          <Link to="/">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
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
              
              {/* Q1 Months */}
              <TableHead className="bg-gray-50 text-center">Jan</TableHead>
              <TableHead className="bg-gray-50 text-center">Feb</TableHead>
              <TableHead className="bg-gray-50 text-center">Mar</TableHead>
              {/* Q1 Total */}
              <TableHead className="bg-gray-100 text-center font-bold">Q1</TableHead>
              
              {/* Q2 Months */}
              <TableHead className="bg-gray-50 text-center">Apr</TableHead>
              <TableHead className="bg-gray-50 text-center">May</TableHead>
              <TableHead className="bg-gray-50 text-center">Jun</TableHead>
              {/* Q2 Total */}
              <TableHead className="bg-gray-100 text-center font-bold">Q2</TableHead>
              
              {/* Q3 Months */}
              <TableHead className="bg-gray-50 text-center">Jul</TableHead>
              <TableHead className="bg-gray-50 text-center">Aug</TableHead>
              <TableHead className="bg-gray-50 text-center">Sep</TableHead>
              {/* Q3 Total */}
              <TableHead className="bg-gray-100 text-center font-bold">Q3</TableHead>
              
              {/* Q4 Months */}
              <TableHead className="bg-gray-50 text-center">Oct</TableHead>
              <TableHead className="bg-gray-50 text-center">Nov</TableHead>
              <TableHead className="bg-gray-50 text-center">Dec</TableHead>
              {/* Q4 Total */}
              <TableHead className="bg-gray-100 text-center font-bold">Q4</TableHead>
              
              {/* Fiscal Year Total */}
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
                  
                  {/* Render Q1 months */}
                  <TableCell className="p-0">
                    <PlanningHoursCell
                      userId={currentUser.id || ''}
                      versionId={selectedVersionId || ''}
                      clientId={client.clientId}
                      month="Jan"
                      initialValue={client.months.Jan}
                      isLocked={isMonthLocked("Jan")}
                      onUpdate={handleCellUpdate}
                    />
                  </TableCell>
                  <TableCell className="p-0">
                    <PlanningHoursCell
                      userId={currentUser.id || ''}
                      versionId={selectedVersionId || ''}
                      clientId={client.clientId}
                      month="Feb"
                      initialValue={client.months.Feb}
                      isLocked={isMonthLocked("Feb")}
                      onUpdate={handleCellUpdate}
                    />
                  </TableCell>
                  <TableCell className="p-0">
                    <PlanningHoursCell
                      userId={currentUser.id || ''}
                      versionId={selectedVersionId || ''}
                      clientId={client.clientId}
                      month="Mar"
                      initialValue={client.months.Mar}
                      isLocked={isMonthLocked("Mar")}
                      onUpdate={handleCellUpdate}
                    />
                  </TableCell>
                  {/* Q1 Total */}
                  <TableCell className="bg-gray-100 text-center font-medium">
                    {client.quarters.Q1 > 0 ? client.quarters.Q1 : '-'}
                  </TableCell>
                  
                  {/* Render Q2 months */}
                  <TableCell className="p-0">
                    <PlanningHoursCell
                      userId={currentUser.id || ''}
                      versionId={selectedVersionId || ''}
                      clientId={client.clientId}
                      month="Apr"
                      initialValue={client.months.Apr}
                      isLocked={isMonthLocked("Apr")}
                      onUpdate={handleCellUpdate}
                    />
                  </TableCell>
                  <TableCell className="p-0">
                    <PlanningHoursCell
                      userId={currentUser.id || ''}
                      versionId={selectedVersionId || ''}
                      clientId={client.clientId}
                      month="May"
                      initialValue={client.months.May}
                      isLocked={isMonthLocked("May")}
                      onUpdate={handleCellUpdate}
                    />
                  </TableCell>
                  <TableCell className="p-0">
                    <PlanningHoursCell
                      userId={currentUser.id || ''}
                      versionId={selectedVersionId || ''}
                      clientId={client.clientId}
                      month="Jun"
                      initialValue={client.months.Jun}
                      isLocked={isMonthLocked("Jun")}
                      onUpdate={handleCellUpdate}
                    />
                  </TableCell>
                  {/* Q2 Total */}
                  <TableCell className="bg-gray-100 text-center font-medium">
                    {client.quarters.Q2 > 0 ? client.quarters.Q2 : '-'}
                  </TableCell>
                  
                  {/* Render Q3 months */}
                  <TableCell className="p-0">
                    <PlanningHoursCell
                      userId={currentUser.id || ''}
                      versionId={selectedVersionId || ''}
                      clientId={client.clientId}
                      month="Jul"
                      initialValue={client.months.Jul}
                      isLocked={isMonthLocked("Jul")}
                      onUpdate={handleCellUpdate}
                    />
                  </TableCell>
                  <TableCell className="p-0">
                    <PlanningHoursCell
                      userId={currentUser.id || ''}
                      versionId={selectedVersionId || ''}
                      clientId={client.clientId}
                      month="Aug"
                      initialValue={client.months.Aug}
                      isLocked={isMonthLocked("Aug")}
                      onUpdate={handleCellUpdate}
                    />
                  </TableCell>
                  <TableCell className="p-0">
                    <PlanningHoursCell
                      userId={currentUser.id || ''}
                      versionId={selectedVersionId || ''}
                      clientId={client.clientId}
                      month="Sep"
                      initialValue={client.months.Sep}
                      isLocked={isMonthLocked("Sep")}
                      onUpdate={handleCellUpdate}
                    />
                  </TableCell>
                  {/* Q3 Total */}
                  <TableCell className="bg-gray-100 text-center font-medium">
                    {client.quarters.Q3 > 0 ? client.quarters.Q3 : '-'}
                  </TableCell>
                  
                  {/* Render Q4 months */}
                  <TableCell className="p-0">
                    <PlanningHoursCell
                      userId={currentUser.id || ''}
                      versionId={selectedVersionId || ''}
                      clientId={client.clientId}
                      month="Oct"
                      initialValue={client.months.Oct}
                      isLocked={isMonthLocked("Oct")}
                      onUpdate={handleCellUpdate}
                    />
                  </TableCell>
                  <TableCell className="p-0">
                    <PlanningHoursCell
                      userId={currentUser.id || ''}
                      versionId={selectedVersionId || ''}
                      clientId={client.clientId}
                      month="Nov"
                      initialValue={client.months.Nov}
                      isLocked={isMonthLocked("Nov")}
                      onUpdate={handleCellUpdate}
                    />
                  </TableCell>
                  <TableCell className="p-0">
                    <PlanningHoursCell
                      userId={currentUser.id || ''}
                      versionId={selectedVersionId || ''}
                      clientId={client.clientId}
                      month="Dec"
                      initialValue={client.months.Dec}
                      isLocked={isMonthLocked("Dec")}
                      onUpdate={handleCellUpdate}
                    />
                  </TableCell>
                  {/* Q4 Total */}
                  <TableCell className="bg-gray-100 text-center font-medium">
                    {client.quarters.Q4 > 0 ? client.quarters.Q4 : '-'}
                  </TableCell>
                  
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
