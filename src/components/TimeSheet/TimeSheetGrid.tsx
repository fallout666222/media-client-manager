import React from 'react';
import { Input } from "@/components/ui/input";
import { TimeEntry, TimeSheetStatus } from '@/types/timesheet';

interface TimeSheetGridProps {
  clients: string[];
  mediaTypes: string[];
  timeEntries: Record<string, Record<string, TimeEntry>>;
  onTimeUpdate: (client: string, mediaType: string, hours: number) => void;
  status: TimeSheetStatus;
}

export const TimeSheetGrid = ({ 
  clients, 
  mediaTypes, 
  timeEntries,
  onTimeUpdate,
  status
}: TimeSheetGridProps) => {
  const isReadOnly = status === 'under-review' || status === 'accepted';

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
                    max="40"
                    step="0.5"
                    className="timesheet-input"
                    value={timeEntries[client]?.[type]?.hours || ''}
                    onChange={(e) => {
                      const hours = parseFloat(e.target.value) || 0;
                      onTimeUpdate(client, type, hours);
                    }}
                    disabled={isReadOnly}
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