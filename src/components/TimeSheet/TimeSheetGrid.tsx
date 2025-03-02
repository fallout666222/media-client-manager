
import React from 'react';
import { Input } from "@/components/ui/input";
import { TimeEntry, TimeSheetStatus } from '@/types/timesheet';
import { useToast } from "@/hooks/use-toast";

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
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="timesheet-header text-left">Client/Category</th>
            {mediaTypes.map((type) => (
              <th key={type} className="timesheet-header">
                {type}
              </th>
            ))}
            <th className="timesheet-header">Total</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client}>
              <td className="timesheet-cell font-medium">{client}</td>
              {mediaTypes.map((type) => (
                <td key={`${client}-${type}`} className="timesheet-cell">
                  <Input
                    type="number"
                    min="0"
                    max={weekHours.toString()}
                    step="1"
                    className="timesheet-input"
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
                </td>
              ))}
              <td className="timesheet-cell font-medium">
                {mediaTypes.reduce((sum, type) => 
                  sum + (timeEntries[client]?.[type]?.hours || 0), 0
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
