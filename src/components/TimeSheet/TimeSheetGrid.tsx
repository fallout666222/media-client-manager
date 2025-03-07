
import React, { useState, useEffect } from 'react';
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
  
  useEffect(() => {
    const initialEntries: Record<string, Record<string, number>> = {};
    
    Object.entries(timeEntries).forEach(([client, mediaEntries]) => {
      initialEntries[client] = {};
      Object.entries(mediaEntries).forEach(([type, entry]) => {
        initialEntries[client][type] = entry.hours || 0;
      });
    });
    
    setLocalTimeEntries(initialEntries);
  }, [timeEntries]);
  
  const effectiveWeekHours = Math.round(weekHours * (weekPercentage / 100));

  const calculateTotalHours = (excludingClient?: string, excludingType?: string): number => {
    return Object.entries(timeEntries).reduce((clientSum, [client, mediaEntries]) => {
      if (client === excludingClient) return clientSum;
      return clientSum + Object.entries(mediaEntries).reduce((mediaSum, [type, entry]) => {
        if (type === excludingType && client === excludingClient) return mediaSum;
        return mediaSum + (entry.hours || 0);
      }, 0);
    }, 0);
  };

  const handleInputChange = (client: string, type: string, value: string) => {
    const hours = value === '' ? 0 : parseInt(value) || 0;
    console.log(`Input change: ${client} - ${type} - ${hours}`);
    
    setLocalTimeEntries(prev => {
      const updated = { ...prev };
      if (!updated[client]) updated[client] = {};
      updated[client][type] = hours;
      return updated;
    });
  };

  const handleInputBlur = (client: string, type: string) => {
    const hours = localTimeEntries[client]?.[type] || 0;
    const currentValue = timeEntries[client]?.[type]?.hours || 0;
    
    console.log(`Input blur: ${client} - ${type} - hours: ${hours}, currentValue: ${currentValue}`);
    
    if (hours !== currentValue) {
      const currentTotal = calculateTotalHours(client, type);
      const newTotal = currentTotal + hours;
      
      console.log(`Current total: ${currentTotal}, New total: ${newTotal}, Limit: ${effectiveWeekHours}`);
      
      if (newTotal > effectiveWeekHours) {
        toast({
          title: "Cannot Add Hours",
          description: `Total hours cannot exceed ${effectiveWeekHours} for the week (${weekPercentage}% of ${weekHours})`,
          variant: "destructive"
        });
        
        setLocalTimeEntries(prev => {
          const updated = { ...prev };
          if (!updated[client]) updated[client] = {};
          updated[client][type] = currentValue;
          return updated;
        });
        return;
      }
      
      console.log(`Calling onTimeUpdate with ${client}, ${type}, ${hours}`);
      // Always call onTimeUpdate to sync with database
      onTimeUpdate(client, type, hours);
    }
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
                    value={localTimeEntries[client]?.[type] !== undefined ? 
                      (localTimeEntries[client][type] === 0 ? '' : localTimeEntries[client][type]) : 
                      ''}
                    onChange={(e) => handleInputChange(client, type, e.target.value)}
                    onBlur={() => handleInputBlur(client, type)}
                    disabled={isFormDisabled}
                  />
                </TableCell>
              ))}
              <TableCell className="font-medium text-center">
                {mediaTypes.reduce((sum, type) => 
                  sum + (timeEntries[client]?.[type]?.hours || 0), 0
                )}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-muted/20">
            <TableCell className="font-bold">Total</TableCell>
            {mediaTypes.map((type) => (
              <TableCell key={`total-${type}`} className="font-bold text-center">
                {clients.reduce((sum, client) => 
                  sum + (timeEntries[client]?.[type]?.hours || 0), 0
                )}
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
