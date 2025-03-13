
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { TimeEntry, TimeSheetStatus } from '@/types/timesheet';
import { useToast } from "@/hooks/use-toast";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSettings } from '@/contexts/SettingsContext';

interface TimeSheetGridProps {
  clients: string[];
  mediaTypes: string[];
  timeEntries: Record<string, Record<string, TimeEntry>>;
  onTimeUpdate: (client: string, mediaType: string, hours: number) => void;
  status: TimeSheetStatus;
  weekHours?: number;
  readOnly?: boolean;
  weekPercentage?: number;
  isUserHead?: boolean;
}

export const TimeSheetGrid = ({ 
  clients, 
  mediaTypes, 
  timeEntries,
  onTimeUpdate,
  status,
  weekHours = 40,
  readOnly = false,
  weekPercentage = 100,
  isUserHead = false
}: TimeSheetGridProps) => {
  const isFormDisabled = readOnly || status === 'under-review' || status === 'accepted';
  const { toast } = useToast();
  const [localTimeEntries, setLocalTimeEntries] = useState<Record<string, Record<string, number>>>({});
  const { language } = useSettings();
  
  const translations = {
    en: {
      clientCategory: "Client/Category",
      total: "Total",
      cannotAddHours: "Cannot Add Hours",
      totalHoursExceed: `Total hours cannot exceed ${Math.round(weekHours * (weekPercentage / 100))} for the week (${weekPercentage}% of ${weekHours})`,
      hoursBelow: "Hours Below Required",
      currentTotal: "Current total",
      isBelow: "is below the required",
      hoursForWeek: "hours for this week",
      noClientsMedia: "No clients or media types are selected. Please go to settings to select clients and media types.",
      noClients: "No clients are selected. Please go to settings to select clients.",
      noMediaTypes: "No media types are selected. Please go to settings to select media types."
    },
    ru: {
      clientCategory: "Клиент/Категория",
      total: "Всего",
      cannotAddHours: "Невозможно добавить часы",
      totalHoursExceed: `Общее количество часов не может превышать ${Math.round(weekHours * (weekPercentage / 100))} на неделю (${weekPercentage}% от ${weekHours})`,
      hoursBelow: "Часы ниже требуемых",
      currentTotal: "Текущая сумма",
      isBelow: "ниже требуемых",
      hoursForWeek: "часов на эту неделю",
      noClientsMedia: "Не выбраны клиенты или типы медиа. Перейдите в настройки, чтобы выбрать клиентов и типы медиа.",
      noClients: "Не выбраны клиенты. Перейдите в настройки, чтобы выбрать клиентов.",
      noMediaTypes: "Не выбраны типы медиа. Перейдите в настройки, чтобы выбрать типы медиа."
    }
  };
  
  const t = translations[language];
  
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
    // console.log(`Input change: ${client} - ${type} - ${hours}`);
    
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
    
    // console.log(`Input blur: ${client} - ${type} - hours: ${hours}, currentValue: ${currentValue}`);
    
    if (hours !== currentValue) {
      const currentTotal = calculateTotalHours(client, type);
      const newTotal = currentTotal + hours;
      
      // console.log(`Current total: ${currentTotal}, New total: ${newTotal}, Limit: ${effectiveWeekHours}`);
      
      if (newTotal > effectiveWeekHours && !isUserHead) {
        toast({
          title: t.cannotAddHours,
          description: t.totalHoursExceed,
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
      
      if (isUserHead && newTotal < effectiveWeekHours) {
        toast({
          title: t.hoursBelow,
          description: `${t.currentTotal} (${newTotal}) ${t.isBelow} ${effectiveWeekHours} ${t.hoursForWeek}`,
          variant: "default"
        });
      }
      
      // console.log(`Calling onTimeUpdate with ${client}, ${type}, ${hours}`);
      onTimeUpdate(client, type, hours);
    }
  };

  if (clients.length === 0 || mediaTypes.length === 0) {
    return (
      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {clients.length === 0 && mediaTypes.length === 0 
            ? t.noClientsMedia
            : clients.length === 0 
              ? t.noClients
              : t.noMediaTypes
          }
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left">{t.clientCategory}</TableHead>
            {mediaTypes.map((type) => (
              <TableHead key={type} className="text-center">
                {type}
              </TableHead>
            ))}
            <TableHead className="text-center">{t.total}</TableHead>
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
            <TableCell className="font-bold">{t.total}</TableCell>
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
