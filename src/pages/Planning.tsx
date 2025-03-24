
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Settings } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableFooter
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
import { PlanningVersionStatus } from '@/components/Planning/PlanningVersionStatus';
import { User, Client } from '@/types/timesheet';

interface PlanningProps {
  currentUser: User;
  clients: Client[];
  isUserHead?: boolean;
}

export default function Planning({ currentUser, clients, isUserHead = false }: PlanningProps) {
  const { 
    versions, 
    selectedVersionId, 
    setSelectedVersionId, 
    planningData, 
    reloadPlanningData,
    visibleClients,
    months,
    quarters,
    versionStatus,
    monthlyLimits,
    totalPlannedHours
  } = usePlanningData({ currentUser, isUserHead });
  
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

  // Is cell locked because of status
  const isCellLockedByStatus = (status: string) => {
    // Only can edit if unconfirmed or needs-revision
    return !(status === 'unconfirmed' || status === 'needs-revision');
  };

  const handleCellUpdate = useCallback(() => {
    // Trigger reload of planning data
    if (reloadPlanningData) {
      reloadPlanningData();
    }
  }, [reloadPlanningData]);

  const handleStatusUpdate = useCallback(() => {
    // Reload data to get updated status
    reloadPlanningData();
  }, [reloadPlanningData]);

  // Calculate month totals for all clients
  const calculateMonthTotals = () => {
    const totals: Record<string, number> = {};
    const quarterTotals: Record<string, number> = {};
    
    // Initialize totals
    months.forEach(month => {
      totals[month] = 0;
    });
    
    quarters.forEach(quarter => {
      quarterTotals[quarter.name] = 0;
    });
    
    // Sum up the hours for each month and quarter
    filteredClients.forEach(client => {
      months.forEach(month => {
        totals[month] += client.months[month] || 0;
      });
      
      quarters.forEach(quarter => {
        quarterTotals[quarter.name] += client.quarters[quarter.name] || 0;
      });
    });
    
    return { monthTotals: totals, quarterTotals };
  };
  
  const { monthTotals, quarterTotals } = calculateMonthTotals();

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
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
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
                  {version.name} ({version.year}) {version.status && `- ${version.status}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {selectedVersionId && (
          <PlanningVersionStatus
            currentUser={currentUser}
            versionId={selectedVersionId}
            currentStatus={versionStatus}
            isUserHead={isUserHead}
            onStatusUpdate={handleStatusUpdate}
            monthlyLimits={monthlyLimits}
            monthTotals={monthTotals}
            totalPlannedHours={totalPlannedHours}
          />
        )}
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
                      isLocked={isMonthLocked("Jan") || isCellLockedByStatus(versionStatus)}
                      onUpdate={handleCellUpdate}
                      monthLimit={monthlyLimits?.Jan}
                      monthTotal={monthTotals.Jan}
                    />
                  </TableCell>
                  <TableCell className="p-0">
                    <PlanningHoursCell
                      userId={currentUser.id || ''}
                      versionId={selectedVersionId || ''}
                      clientId={client.clientId}
                      month="Feb"
                      initialValue={client.months.Feb}
                      isLocked={isMonthLocked("Feb") || isCellLockedByStatus(versionStatus)}
                      onUpdate={handleCellUpdate}
                      monthLimit={monthlyLimits?.Feb}
                      monthTotal={monthTotals.Feb}
                    />
                  </TableCell>
                  <TableCell className="p-0">
                    <PlanningHoursCell
                      userId={currentUser.id || ''}
                      versionId={selectedVersionId || ''}
                      clientId={client.clientId}
                      month="Mar"
                      initialValue={client.months.Mar}
                      isLocked={isMonthLocked("Mar") || isCellLockedByStatus(versionStatus)}
                      onUpdate={handleCellUpdate}
                      monthLimit={monthlyLimits?.Mar}
                      monthTotal={monthTotals.Mar}
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
                      isLocked={isMonthLocked("Apr") || isCellLockedByStatus(versionStatus)}
                      onUpdate={handleCellUpdate}
                      monthLimit={monthlyLimits?.Apr}
                      monthTotal={monthTotals.Apr}
                    />
                  </TableCell>
                  <TableCell className="p-0">
                    <PlanningHoursCell
                      userId={currentUser.id || ''}
                      versionId={selectedVersionId || ''}
                      clientId={client.clientId}
                      month="May"
                      initialValue={client.months.May}
                      isLocked={isMonthLocked("May") || isCellLockedByStatus(versionStatus)}
                      onUpdate={handleCellUpdate}
                      monthLimit={monthlyLimits?.May}
                      monthTotal={monthTotals.May}
                    />
                  </TableCell>
                  <TableCell className="p-0">
                    <PlanningHoursCell
                      userId={currentUser.id || ''}
                      versionId={selectedVersionId || ''}
                      clientId={client.clientId}
                      month="Jun"
                      initialValue={client.months.Jun}
                      isLocked={isMonthLocked("Jun") || isCellLockedByStatus(versionStatus)}
                      onUpdate={handleCellUpdate}
                      monthLimit={monthlyLimits?.Jun}
                      monthTotal={monthTotals.Jun}
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
                      isLocked={isMonthLocked("Jul") || isCellLockedByStatus(versionStatus)}
                      onUpdate={handleCellUpdate}
                      monthLimit={monthlyLimits?.Jul}
                      monthTotal={monthTotals.Jul}
                    />
                  </TableCell>
                  <TableCell className="p-0">
                    <PlanningHoursCell
                      userId={currentUser.id || ''}
                      versionId={selectedVersionId || ''}
                      clientId={client.clientId}
                      month="Aug"
                      initialValue={client.months.Aug}
                      isLocked={isMonthLocked("Aug") || isCellLockedByStatus(versionStatus)}
                      onUpdate={handleCellUpdate}
                      monthLimit={monthlyLimits?.Aug}
                      monthTotal={monthTotals.Aug}
                    />
                  </TableCell>
                  <TableCell className="p-0">
                    <PlanningHoursCell
                      userId={currentUser.id || ''}
                      versionId={selectedVersionId || ''}
                      clientId={client.clientId}
                      month="Sep"
                      initialValue={client.months.Sep}
                      isLocked={isMonthLocked("Sep") || isCellLockedByStatus(versionStatus)}
                      onUpdate={handleCellUpdate}
                      monthLimit={monthlyLimits?.Sep}
                      monthTotal={monthTotals.Sep}
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
                      isLocked={isMonthLocked("Oct") || isCellLockedByStatus(versionStatus)}
                      onUpdate={handleCellUpdate}
                      monthLimit={monthlyLimits?.Oct}
                      monthTotal={monthTotals.Oct}
                    />
                  </TableCell>
                  <TableCell className="p-0">
                    <PlanningHoursCell
                      userId={currentUser.id || ''}
                      versionId={selectedVersionId || ''}
                      clientId={client.clientId}
                      month="Nov"
                      initialValue={client.months.Nov}
                      isLocked={isMonthLocked("Nov") || isCellLockedByStatus(versionStatus)}
                      onUpdate={handleCellUpdate}
                      monthLimit={monthlyLimits?.Nov}
                      monthTotal={monthTotals.Nov}
                    />
                  </TableCell>
                  <TableCell className="p-0">
                    <PlanningHoursCell
                      userId={currentUser.id || ''}
                      versionId={selectedVersionId || ''}
                      clientId={client.clientId}
                      month="Dec"
                      initialValue={client.months.Dec}
                      isLocked={isMonthLocked("Dec") || isCellLockedByStatus(versionStatus)}
                      onUpdate={handleCellUpdate}
                      monthLimit={monthlyLimits?.Dec}
                      monthTotal={monthTotals.Dec}
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
                  No planning data available. Click on a cell to add hours.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          
          {/* Table Footer with Monthly Totals and Limits */}
          <TableFooter>
            <TableRow>
              <TableCell className="font-bold bg-gray-200 sticky left-0 z-10">Total</TableCell>
              
              {/* Month totals for Q1 */}
              <TableCell className="text-center font-medium bg-gray-200">
                {monthTotals.Jan}
              </TableCell>
              <TableCell className="text-center font-medium bg-gray-200">
                {monthTotals.Feb}
              </TableCell>
              <TableCell className="text-center font-medium bg-gray-200">
                {monthTotals.Mar}
              </TableCell>
              <TableCell className="text-center font-bold bg-gray-300">
                {quarterTotals.Q1}
              </TableCell>
              
              {/* Month totals for Q2 */}
              <TableCell className="text-center font-medium bg-gray-200">
                {monthTotals.Apr}
              </TableCell>
              <TableCell className="text-center font-medium bg-gray-200">
                {monthTotals.May}
              </TableCell>
              <TableCell className="text-center font-medium bg-gray-200">
                {monthTotals.Jun}
              </TableCell>
              <TableCell className="text-center font-bold bg-gray-300">
                {quarterTotals.Q2}
              </TableCell>
              
              {/* Month totals for Q3 */}
              <TableCell className="text-center font-medium bg-gray-200">
                {monthTotals.Jul}
              </TableCell>
              <TableCell className="text-center font-medium bg-gray-200">
                {monthTotals.Aug}
              </TableCell>
              <TableCell className="text-center font-medium bg-gray-200">
                {monthTotals.Sep}
              </TableCell>
              <TableCell className="text-center font-bold bg-gray-300">
                {quarterTotals.Q3}
              </TableCell>
              
              {/* Month totals for Q4 */}
              <TableCell className="text-center font-medium bg-gray-200">
                {monthTotals.Oct}
              </TableCell>
              <TableCell className="text-center font-medium bg-gray-200">
                {monthTotals.Nov}
              </TableCell>
              <TableCell className="text-center font-medium bg-gray-200">
                {monthTotals.Dec}
              </TableCell>
              <TableCell className="text-center font-bold bg-gray-300">
                {quarterTotals.Q4}
              </TableCell>
              
              {/* Year total */}
              <TableCell className="text-center font-bold bg-blue-200">
                {totalPlannedHours}
              </TableCell>
            </TableRow>
            
            {/* Monthly Limits Row */}
            <TableRow>
              <TableCell className="font-bold bg-gray-100 sticky left-0 z-10">Target Hours</TableCell>
              
              {/* Month limits for Q1 */}
              <TableCell className="text-center text-sm bg-gray-100">
                {monthlyLimits?.Jan ? `${monthTotals.Jan}/${monthlyLimits.Jan}` : '-'}
              </TableCell>
              <TableCell className="text-center text-sm bg-gray-100">
                {monthlyLimits?.Feb ? `${monthTotals.Feb}/${monthlyLimits.Feb}` : '-'}
              </TableCell>
              <TableCell className="text-center text-sm bg-gray-100">
                {monthlyLimits?.Mar ? `${monthTotals.Mar}/${monthlyLimits.Mar}` : '-'}
              </TableCell>
              <TableCell className="text-center text-sm bg-gray-100">
                {`${quarterTotals.Q1}/${(monthlyLimits?.Jan || 0) + (monthlyLimits?.Feb || 0) + (monthlyLimits?.Mar || 0)}`}
              </TableCell>
              
              {/* Month limits for Q2 */}
              <TableCell className="text-center text-sm bg-gray-100">
                {monthlyLimits?.Apr ? `${monthTotals.Apr}/${monthlyLimits.Apr}` : '-'}
              </TableCell>
              <TableCell className="text-center text-sm bg-gray-100">
                {monthlyLimits?.May ? `${monthTotals.May}/${monthlyLimits.May}` : '-'}
              </TableCell>
              <TableCell className="text-center text-sm bg-gray-100">
                {monthlyLimits?.Jun ? `${monthTotals.Jun}/${monthlyLimits.Jun}` : '-'}
              </TableCell>
              <TableCell className="text-center text-sm bg-gray-100">
                {`${quarterTotals.Q2}/${(monthlyLimits?.Apr || 0) + (monthlyLimits?.May || 0) + (monthlyLimits?.Jun || 0)}`}
              </TableCell>
              
              {/* Month limits for Q3 */}
              <TableCell className="text-center text-sm bg-gray-100">
                {monthlyLimits?.Jul ? `${monthTotals.Jul}/${monthlyLimits.Jul}` : '-'}
              </TableCell>
              <TableCell className="text-center text-sm bg-gray-100">
                {monthlyLimits?.Aug ? `${monthTotals.Aug}/${monthlyLimits.Aug}` : '-'}
              </TableCell>
              <TableCell className="text-center text-sm bg-gray-100">
                {monthlyLimits?.Sep ? `${monthTotals.Sep}/${monthlyLimits.Sep}` : '-'}
              </TableCell>
              <TableCell className="text-center text-sm bg-gray-100">
                {`${quarterTotals.Q3}/${(monthlyLimits?.Jul || 0) + (monthlyLimits?.Aug || 0) + (monthlyLimits?.Sep || 0)}`}
              </TableCell>
              
              {/* Month limits for Q4 */}
              <TableCell className="text-center text-sm bg-gray-100">
                {monthlyLimits?.Oct ? `${monthTotals.Oct}/${monthlyLimits.Oct}` : '-'}
              </TableCell>
              <TableCell className="text-center text-sm bg-gray-100">
                {monthlyLimits?.Nov ? `${monthTotals.Nov}/${monthlyLimits.Nov}` : '-'}
              </TableCell>
              <TableCell className="text-center text-sm bg-gray-100">
                {monthlyLimits?.Dec ? `${monthTotals.Dec}/${monthlyLimits.Dec}` : '-'}
              </TableCell>
              <TableCell className="text-center text-sm bg-gray-100">
                {`${quarterTotals.Q4}/${(monthlyLimits?.Oct || 0) + (monthlyLimits?.Nov || 0) + (monthlyLimits?.Dec || 0)}`}
              </TableCell>
              
              {/* Year total/limit */}
              <TableCell className="text-center font-bold bg-blue-100">
                {`${totalPlannedHours}/${monthlyLimits?.totalLimit || 0}`}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
