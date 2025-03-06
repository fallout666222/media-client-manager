
import React, { useState, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { TimeEntry, TimeSheetStatus } from '@/types/timesheet';
import { useToast } from "@/hooks/use-toast";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";

interface TimeSheetGridProps {
  clients: string[];
  mediaTypes: string[];
  timeEntries: Record<string, Record<string, TimeEntry>>;
  onTimeUpdate: (client: string, mediaType: string, hours: number) => void;
  status: TimeSheetStatus;
  weekHours?: number;
  readOnly?: boolean;
  weekPercentage?: number;
}

export const TimeSheetGrid = ({ 
  clients, 
  mediaTypes, 
  timeEntries,
  onTimeUpdate,
  status,
  weekHours = 40,
  readOnly = false,
  weekPercentage = 100
}: TimeSheetGridProps) => {
  const isFormDisabled = readOnly || status === 'under-review' || status === 'accepted';
  const { toast } = useToast();
  const [localTimeEntries, setLocalTimeEntries] = useState<Record<string, Record<string, number>>>({});
  const [activeInput, setActiveInput] = useState<string | null>(null);
  
  // Calculate effective hours based on week percentage
  const effectiveWeekHours = Math.round(weekHours * (weekPercentage / 100));

  const calculateTotalHours = (excludingClient?: string, excludingType?: string): number => {
    // Start with local changes
    let total = Object.entries(localTimeEntries).reduce((clientSum, [client, mediaEntries]) => {
      if (client === excludingClient) return clientSum;
      return clientSum + Object.entries(mediaEntries).reduce((mediaSum, [type, hours]) => {
        if (type === excludingType && client === excludingClient) return mediaSum;
        return mediaSum + (hours || 0);
      }, 0);
    }, 0);
    
    // Add values from timeEntries that don't have local changes
    Object.entries(timeEntries).forEach(([client, mediaEntries]) => {
      if (!(client in localTimeEntries) || client === excludingClient) {
        Object.entries(mediaEntries).forEach(([type, entry]) => {
          if (
            (!(client in localTimeEntries) || !(type in localTimeEntries[client])) && 
            !(client === excludingClient && type === excludingType)
          ) {
            total += (entry.hours || 0);
          }
        });
      } else {
        Object.entries(mediaEntries).forEach(([type, entry]) => {
          if (
            !(type in localTimeEntries[client]) && 
            !(client === excludingClient && type === excludingType)
          ) {
            total += (entry.hours || 0);
          }
        });
      }
    });
    
    return total;
  };

  const handleInputChange = (client: string, type: string, value: string) => {
    const hours = parseInt(value) || 0;
    
    setLocalTimeEntries(prev => {
      const newEntries = { ...prev };
      if (!newEntries[client]) {
        newEntries[client] = {};
      }
      newEntries[client][type] = hours;
      return newEntries;
    });
    
    // Set this as the active input
    setActiveInput(`${client}-${type}`);
  };
  
  const handleInputBlur = (client: string, type: string) => {
    if (activeInput !== `${client}-${type}`) return;
    
    setActiveInput(null);
    
    // Get the current local value
    const hours = localTimeEntries[client]?.[type] ?? 0;
    const currentValue = timeEntries[client]?.[type]?.hours || 0;
    
    // Skip if value hasn't changed
    if (hours === currentValue) return;
    
    // Calculate totals to check if we exceed limits
    const currentTotal = calculateTotalHours(client, type);
    const newTotal = currentTotal + hours - currentValue;
    
    if (newTotal > effectiveWeekHours) {
      toast({
        title: "Cannot Add Hours",
        description: `Total hours cannot exceed ${effectiveWeekHours} for the week (${weekPercentage}% of ${weekHours})`,
        variant: "destructive"
      });
      
      // Reset the local value
      setLocalTimeEntries(prev => {
        const newEntries = { ...prev };
        if (newEntries[client] && type in newEntries[client]) {
          newEntries[client][type] = currentValue;
        }
        return newEntries;
      });
      
      return;
    }
    
    // Now save to database
    onTimeUpdate(client, type, hours);
    
    // Clear this entry from local changes after saving
    setLocalTimeEntries(prev => {
      const newEntries = { ...prev };
      if (newEntries[client] && type in newEntries[client]) {
        delete newEntries[client][type];
        if (Object.keys(newEntries[client]).length === 0) {
          delete newEntries[client];
        }
      }
      return newEntries;
    });
  };
  
  // Get display value, preferring local value if it exists
  const getDisplayValue = (client: string, type: string): string => {
    if (localTimeEntries[client]?.[type] !== undefined) {
      return localTimeEntries[client][type].toString();
    }
    return timeEntries[client]?.[type]?.hours?.toString() || '';
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left">Client/Category</TableHead>
            {mediaTypes.map((type) => (
              <TableHead key={type} className="text-center">
                {type}
              </TableHead>
            ))}
            <TableHead className="text-center">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client}>
              <TableCell className="font-medium">{client}</TableCell>
              {mediaTypes.map((type) => (
                <TableCell key={`${client}-${type}`} className="p-2">
                  <Input
                    type="number"
                    min="0"
                    max={effectiveWeekHours.toString()}
                    step="1"
                    className="text-center"
                    value={getDisplayValue(client, type)}
                    onChange={(e) => handleInputChange(client, type, e.target.value)}
                    onBlur={() => handleInputBlur(client, type)}
                    disabled={isFormDisabled}
                  />
                </TableCell>
              ))}
              <TableCell className="font-medium text-center">
                {mediaTypes.reduce((sum, type) => {
                  // Use local time entries if available, otherwise use server data
                  const hours = localTimeEntries[client]?.[type] !== undefined
                    ? localTimeEntries[client][type]
                    : (timeEntries[client]?.[type]?.hours || 0);
                  return sum + hours;
                }, 0)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-muted/20">
            <TableCell className="font-bold">Total</TableCell>
            {mediaTypes.map((type) => (
              <TableCell key={`total-${type}`} className="font-bold text-center">
                {clients.reduce((sum, client) => {
                  // Use local time entries if available, otherwise use server data
                  const hours = localTimeEntries[client]?.[type] !== undefined
                    ? localTimeEntries[client][type]
                    : (timeEntries[client]?.[type]?.hours || 0);
                  return sum + hours;
                }, 0)}
              </TableCell>
            ))}
            <TableCell className="font-bold text-center">
              {calculateTotalHours()} / {effectiveWeekHours}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
