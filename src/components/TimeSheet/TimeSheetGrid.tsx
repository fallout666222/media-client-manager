
import React from 'react';
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
}

export const TimeSheetGrid = ({ 
  clients, 
  mediaTypes, 
  timeEntries,
  onTimeUpdate,
  status,
  weekHours = 40,
  readOnly = false
}: TimeSheetGridProps) => {
  const isFormDisabled = readOnly || status === 'under-review' || status === 'accepted';
  const { toast } = useToast();

  const calculateTotalHours = (excludingClient?: string, excludingType?: string): number => {
    return Object.entries(timeEntries).reduce((clientSum, [client, mediaEntries]) => {
      if (client === excludingClient) return clientSum;
      return clientSum + Object.entries(mediaEntries).reduce((mediaSum, [type, entry]) => {
        if (type === excludingType && client === excludingClient) return mediaSum;
        return mediaSum + (entry.hours || 0);
      }, 0);
    }, 0);
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
                    max={weekHours.toString()}
                    step="1"
                    className="text-center"
                    value={timeEntries[client]?.[type]?.hours || ''}
                    onChange={(e) => {
                      const hours = parseInt(e.target.value) || 0;
                      const currentTotal = calculateTotalHours(client, type);
                      
                      if (currentTotal + hours > weekHours) {
                        toast({
                          title: "Cannot Add Hours",
                          description: `Total hours cannot exceed ${weekHours} for the week`,
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      onTimeUpdate(client, type, hours);
                    }}
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
              {calculateTotalHours()}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
