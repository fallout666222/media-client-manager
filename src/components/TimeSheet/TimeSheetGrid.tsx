import React, { useState } from 'react';
import { TimeEntry, TimeSheetStatus } from '@/types/timesheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

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
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedMediaType, setSelectedMediaType] = useState<string>('');

  const isReadOnly = status === 'under-review' || status === 'accepted';

  const handleHoursChange = (hours: string) => {
    if (selectedClient && selectedMediaType) {
      const numericHours = parseFloat(hours) || 0;
      onTimeUpdate(selectedClient, selectedMediaType, numericHours);
    }
  };

  const getCurrentHours = () => {
    if (selectedClient && selectedMediaType && timeEntries[selectedClient]?.[selectedMediaType]) {
      return timeEntries[selectedClient][selectedMediaType].hours.toString();
    }
    return '';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Client</label>
          <Select
            value={selectedClient}
            onValueChange={setSelectedClient}
            disabled={isReadOnly}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client} value={client}>
                  {client}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Media Type</label>
          <Select
            value={selectedMediaType}
            onValueChange={setSelectedMediaType}
            disabled={isReadOnly}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select media type" />
            </SelectTrigger>
            <SelectContent>
              {mediaTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedClient && selectedMediaType && (
        <div>
          <label className="block text-sm font-medium mb-2">Hours</label>
          <Input
            type="number"
            min="0"
            max="40"
            step="0.5"
            value={getCurrentHours()}
            onChange={(e) => handleHoursChange(e.target.value)}
            disabled={isReadOnly}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
};