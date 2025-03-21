
import React, { useEffect } from 'react';
import { usePlanning } from '@/hooks/usePlanning';
import { useApp } from '@/contexts/AppContext';
import { useClients } from '@/hooks/useClients';
import { HoursInput } from '@/components/Planning/HoursInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Planning = () => {
  const { user } = useApp();
  const { clients } = useClients();
  
  const {
    versions,
    isLoading,
    selectedVersionId,
    setSelectedVersionId,
    processClientHours,
    planningHours,
    updateHours
  } = usePlanning(user?.id || '');

  const clientHours = processClientHours(planningHours, clients);

  const handleHoursChange = (clientId: string, month: string, hours: number) => {
    updateHours(clientId, month, hours);
  };

  const monthColumns = [
    { id: 'Jan', label: 'Jan', quarter: 'Q1' },
    { id: 'Feb', label: 'Feb', quarter: 'Q1' },
    { id: 'Mar', label: 'Mar', quarter: 'Q1' },
    { id: 'Q1', label: 'Q1', isQuarter: true },
    { id: 'Apr', label: 'Apr', quarter: 'Q2' },
    { id: 'May', label: 'May', quarter: 'Q2' },
    { id: 'Jun', label: 'Jun', quarter: 'Q2' },
    { id: 'Q2', label: 'Q2', isQuarter: true },
    { id: 'Jul', label: 'Jul', quarter: 'Q3' },
    { id: 'Aug', label: 'Aug', quarter: 'Q3' },
    { id: 'Sep', label: 'Sep', quarter: 'Q3' },
    { id: 'Q3', label: 'Q3', isQuarter: true },
    { id: 'Oct', label: 'Oct', quarter: 'Q4' },
    { id: 'Nov', label: 'Nov', quarter: 'Q4' },
    { id: 'Dec', label: 'Dec', quarter: 'Q4' },
    { id: 'Q4', label: 'Q4', isQuarter: true },
    { id: 'FY', label: 'FY', isFiscalYear: true }
  ];

  // Calculate column totals
  const calculateColumnTotals = () => {
    const totals = {
      Jan: 0, Feb: 0, Mar: 0, Q1: 0,
      Apr: 0, May: 0, Jun: 0, Q2: 0,
      Jul: 0, Aug: 0, Sep: 0, Q3: 0,
      Oct: 0, Nov: 0, Dec: 0, Q4: 0,
      FY: 0
    };

    clientHours.forEach(clientHour => {
      Object.keys(totals).forEach(month => {
        totals[month as keyof typeof totals] += clientHour.months[month as keyof typeof totals];
      });
    });

    return totals;
  };

  const columnTotals = calculateColumnTotals();

  // Check if a specific quarter is locked in the selected version
  const isQuarterLocked = (quarterName: string) => {
    if (!selectedVersionId) return false;
    
    const selectedVersion = versions.find(v => v.id === selectedVersionId);
    if (!selectedVersion) return false;
    
    switch (quarterName) {
      case 'Q1': return selectedVersion.q1_locked;
      case 'Q2': return selectedVersion.q2_locked;
      case 'Q3': return selectedVersion.q3_locked;
      case 'Q4': return selectedVersion.q4_locked;
      default: return false;
    }
  };

  // Check if a month is in a locked quarter
  const isMonthLocked = (month: string) => {
    const q1Months = ['Jan', 'Feb', 'Mar'];
    const q2Months = ['Apr', 'May', 'Jun'];
    const q3Months = ['Jul', 'Aug', 'Sep'];
    const q4Months = ['Oct', 'Nov', 'Dec'];
    
    if (q1Months.includes(month) && isQuarterLocked('Q1')) return true;
    if (q2Months.includes(month) && isQuarterLocked('Q2')) return true;
    if (q3Months.includes(month) && isQuarterLocked('Q3')) return true;
    if (q4Months.includes(month) && isQuarterLocked('Q4')) return true;
    
    return false;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 pt-16">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Planning Management</h1>
        <Link to="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Planning Version:</label>
        <Select
          value={selectedVersionId || ''}
          onValueChange={(value) => setSelectedVersionId(value)}
        >
          <SelectTrigger className="w-full md:w-[300px]">
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

      <div className="overflow-x-auto">
        <Table className="border">
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[200px] font-bold">Client</TableHead>
              {monthColumns.map((column) => (
                <TableHead 
                  key={column.id} 
                  className={`min-w-[80px] text-center font-bold ${
                    column.isQuarter ? 'bg-blue-100' : 
                    column.isFiscalYear ? 'bg-green-100' : ''
                  }`}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientHours.map((clientHour) => (
              <TableRow key={clientHour.client.id}>
                <TableCell className="font-medium">
                  {clientHour.client.name}
                </TableCell>
                {monthColumns.map((column) => (
                  <TableCell key={`${clientHour.client.id}-${column.id}`} className="p-1">
                    <HoursInput
                      value={clientHour.months[column.id as keyof typeof clientHour.months]}
                      isQuarterTotal={column.isQuarter}
                      isFiscalYearTotal={column.isFiscalYear}
                      onChange={column.isQuarter || column.isFiscalYear ? undefined : 
                        (value) => handleHoursChange(clientHour.client.id, column.id, value)}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
            <TableRow className="bg-muted/20 font-bold">
              <TableCell>Total</TableCell>
              {monthColumns.map((column) => (
                <TableCell key={`total-${column.id}`} className="p-1">
                  <HoursInput
                    value={columnTotals[column.id as keyof typeof columnTotals]}
                    isQuarterTotal={column.isQuarter}
                    isFiscalYearTotal={column.isFiscalYear}
                  />
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Planning;
