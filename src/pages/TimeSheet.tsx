import React, { useState, useEffect, useCallback } from 'react';
import { format, parse } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, ArrowLeft, ArrowRight } from "lucide-react";
import { TimeSheetGrid } from "@/components/TimeSheet/TimeSheetGrid";
import { Settings } from "@/components/TimeSheet/Settings";
import { TimeEntry, TimeSheetStatus, User, Client } from '@/types/timesheet';
import { useToast } from "@/hooks/use-toast";
import * as db from "@/integrations/supabase/database";
import { DateRange } from "react-day-picker";

type TimeSheetData = Record<string, Record<string, TimeEntry>>;

interface TimeSheetProps {
  userRole: 'admin' | 'user' | 'manager';
  firstWeek: string;
  currentUser: User | null;
  users: User[];
  clients: Client[];
}

const TimeSheet = ({ userRole, firstWeek, currentUser, users, clients }: TimeSheetProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeEntries, setTimeEntries] = useState<Record<string, Record<string, Record<string, TimeEntry>>>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [status, setStatus] = useState<TimeSheetStatus>('unconfirmed');
  const [weekHours, setWeekHours] = useState(40);
  const [weekPercentage, setWeekPercentage] = useState(100);
  const [availableClients, setAvailableClients] = useState<string[]>([]);
  const [availableMediaTypes, setAvailableMediaTypes] = useState<string[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedMediaTypes, setSelectedMediaTypes] = useState<string[]>([]);
  const [userWeeks, setUserWeeks] = useState<{ id: string; startDate: string; }[]>([]);
  const [hourEntryStatusNames, setHourEntryStatusNames] = useState<Record<string, TimeSheetStatus>>({});
  const [viewedUser, setViewedUser] = useState<User>(currentUser || users[0]);
  const [adminOverride, setAdminOverride] = useState(false);
  const { toast } = useToast();
  const [customWeeks, setCustomWeeks] = useState<any[]>([]);
  const [date, setDate] = useState<DateRange | undefined>(undefined);

  const viewedUserId = searchParams.get('userId');
  const isViewingOwnTimesheet = viewedUserId === currentUser?.id;
  const isUserHead = (currentUser && users.some(u => u.user_head_id === currentUser.id)) || false;

  useEffect(() => {
    if (currentUser) {
      setViewedUser(currentUser);
    }
  }, [currentUser]);

  useEffect(() => {
    if (viewedUserId) {
      const user = users.find(u => u.id === viewedUserId);
      if (user) {
        setViewedUser(user);
      }
    }
  }, [viewedUserId, users]);

  useEffect(() => {
    const storedDate = localStorage.getItem('selectedDate');
    if (storedDate) {
      setCurrentDate(new Date(storedDate));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedDate', currentDate.toISOString());
  }, [currentDate]);

  useEffect(() => {
    const fetchCustomWeeks = async () => {
      try {
        const { data, error } = await db.getCustomWeeks();
        if (error) throw error;
        setCustomWeeks(data || []);
      } catch (error) {
        console.error('Error fetching custom weeks:', error);
      }
    };
    
    fetchCustomWeeks();
  }, []);

  useEffect(() => {
    const fetchVisibleClientsAndTypes = async () => {
      if (viewedUser.id) {
        try {
          const { data: visibleClients } = await db.getUserVisibleClients(viewedUser.id);
          const { data: visibleTypes } = await db.getUserVisibleTypes(viewedUser.id);
          
          const clientNames = visibleClients?.map(vc => vc.client?.name).filter(Boolean) as string[];
          const typeNames = visibleTypes?.map(vt => vt.type?.name).filter(Boolean) as string[];
          
          setAvailableClients(clients.map(c => c.name));
          setAvailableMediaTypes(await db.getMediaTypes().then(res => res.data?.map(t => t.name) || []));
          setSelectedClients(clientNames);
          setSelectedMediaTypes(typeNames);
        } catch (error) {
          console.error('Error fetching visible clients and types:', error);
        }
      }
    };
    
    fetchVisibleClientsAndTypes();
  }, [viewedUser, clients]);

  useEffect(() => {
    const fetchUserWeeks = async () => {
      if (viewedUser.id) {
        try {
          const { data: weekStatuses, error } = await db.getWeekStatuses(viewedUser.id);
          if (error) throw error;
          
          const weeks = weekStatuses?.map(ws => ({
            id: ws.week_id,
            startDate: format(parse(ws.week?.period_from, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd'),
            status: ws.status?.name
          })) || [];
          
          setUserWeeks(weeks.sort((a, b) => (a.startDate > b.startDate ? 1 : -1)));
          
          const statusMap: Record<string, TimeSheetStatus> = {};
          weekStatuses?.forEach(ws => {
            statusMap[ws.week_id] = ws.status?.name as TimeSheetStatus || 'unconfirmed';
          });
          setHourEntryStatusNames(statusMap);
        } catch (error) {
          console.error('Error fetching week statuses:', error);
        }
      }
    };
    
    fetchUserWeeks();
  }, [viewedUser]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setCurrentDate(date);
    }
  };

  const goToPreviousWeek = () => {
    const prevDate = new Date(currentDate);
    prevDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(prevDate);
  };

  const goToNextWeek = () => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(nextDate);
  };

  const handleTimeUpdate = async (client: string, mediaType: string, hours: number) => {
    if (!viewedUser.id) {
      toast({
        title: "Error",
        description: "No user selected",
        variant: "destructive",
      });
      return;
    }
    
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    const customWeek = customWeeks.find(week => 
      format(parse(week.period_from, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') === currentWeekKey
    );
    
    let weekId = null;
    if (customWeek) {
      weekId = customWeek.id;
    } else {
      const defaultWeek = userWeeks.find(w => 
        format(parse(w.startDate, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') === currentWeekKey
      );
      if (defaultWeek) {
        weekId = defaultWeek.id;
      }
    }
    
    if (!weekId) {
      toast({
        title: "Error",
        description: "No week found for the current date",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await db.updateHours(viewedUser.id, weekId, client, mediaType, hours);
      
      setTimeEntries(prev => {
        const updated = { ...prev };
        if (!updated[currentWeekKey]) {
          updated[currentWeekKey] = {};
        }
        if (!updated[currentWeekKey][client]) {
          updated[currentWeekKey][client] = {};
        }
        
        updated[currentWeekKey][client][mediaType] = {
          hours: hours,
          status: status
        };
        
        return updated;
      });
      
      toast({
        title: "Success",
        description: `Updated hours for ${client} - ${mediaType}: ${hours}`,
      });
    } catch (error) {
      console.error('Error updating hours:', error);
      toast({
        title: "Error",
        description: "Failed to update hours",
        variant: "destructive",
      });
    }
  };

  const handleAddClient = (client: string) => {
    setAvailableClients(prev => [...prev, client]);
  };

  const handleRemoveClient = (client: string) => {
    setAvailableClients(prev => prev.filter(c => c !== client));
  };

  const handleAddMediaType = (type: string) => {
    setAvailableMediaTypes(prev => [...prev, type]);
  };

  const handleRemoveMediaType = (type: string) => {
    setAvailableMediaTypes(prev => prev.filter(t => t !== type));
  };

  const handleSelectClient = (client: string) => {
    setSelectedClients(prev => [...prev, client]);
  };

  const handleSelectMediaType = (type: string) => {
    setSelectedMediaTypes(prev => [...prev, type]);
  };

  const handleSaveVisibleClients = async (clients: string[]) => {
    if (viewedUser.id) {
      try {
        await db.updateVisibleClientsOrder(viewedUser.id, clients);
        setSelectedClients(clients);
        toast({
          title: "Success",
          description: "Updated visible clients",
        });
      } catch (error) {
        console.error('Error saving visible clients:', error);
        toast({
          title: "Error",
          description: "Failed to update visible clients",
          variant: "destructive",
        });
      }
    }
  };

  const handleSaveVisibleMediaTypes = async (types: string[]) => {
    if (viewedUser.id) {
      try {
        await db.updateVisibleTypesOrder(viewedUser.id, types);
        setSelectedMediaTypes(types);
        toast({
          title: "Success",
          description: "Updated visible media types",
        });
      } catch (error) {
        console.error('Error saving visible media types:', error);
        toast({
          title: "Error",
          description: "Failed to update visible media types",
          variant: "destructive",
        });
      }
    }
  };

  const handleReorderClients = async (newOrder: string[]) => {
    if (viewedUser.id) {
      try {
        await db.updateVisibleClientsOrder(viewedUser.id, newOrder);
        setSelectedClients(newOrder);
        toast({
          title: "Success",
          description: "Reordered clients successfully",
        });
      } catch (error) {
        console.error("Error reordering clients:", error);
        toast({
          title: "Error",
          description: "Failed to reorder clients",
          variant: "destructive",
        });
      }
    }
  };

  const handleReorderMediaTypes = async (newOrder: string[]) => {
    if (viewedUser.id) {
      try {
        await db.updateVisibleTypesOrder(viewedUser.id, newOrder);
        setSelectedMediaTypes(newOrder);
        toast({
          title: "Success",
          description: "Reordered media types successfully",
        });
      } catch (error) {
        console.error("Error reordering media types:", error);
        toast({
          title: "Error",
          description: "Failed to reorder media types",
          variant: "destructive",
        });
      }
    }
  };

  const loadUserData = useCallback(async () => {
    if (viewedUser.id) {
      try {
        const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
        console.log(`Loading data for week starting on: ${currentWeekKey}`);
        
        let weekId = null;
        const customWeek = customWeeks.find(week => 
          format(parse(week.period_from, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') === currentWeekKey
        );
        
        if (customWeek) {
          weekId = customWeek.id;
          console.log(`Found custom week with ID: ${weekId}`);
        } else {
          const defaultWeek = userWeeks.find(w => 
            format(parse(w.startDate, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') === currentWeekKey
          );
          if (defaultWeek) {
            weekId = defaultWeek.id;
            console.log(`Found default week with ID: ${weekId}`);
          }
        }
        
        if (weekId) {
          console.log(`Loading time entries for user ${viewedUser.id}, week ${weekId}`);
          const { data: hourEntries } = await db.getWeekHours(viewedUser.id, weekId);
          
          if (hourEntries && hourEntries.length > 0) {
            console.log(`Found ${hourEntries.length} time entries for week ${weekId}`);
            
            const entries: Record<string, Record<string, Record<string, TimeEntry>>> = {};
            entries[currentWeekKey] = {};
            
            hourEntries.forEach(entry => {
              const clientName = entry.client?.name || 'Unknown';
              const mediaTypeName = entry.media_type?.name || 'Unknown';
              
              if (!entries[currentWeekKey][clientName]) {
                entries[currentWeekKey][clientName] = {};
              }
              
              entries[currentWeekKey][clientName][mediaTypeName] = {
                hours: entry.hours,
                status: hourEntryStatusNames[weekId] || 'unconfirmed'
              };
            });
            
            setTimeEntries(entries);
          } else {
            console.log(`No time entries found for week ${weekId}`);
            // Only set empty entries if we don't have entries yet
            setTimeEntries(prev => {
              if (!prev[currentWeekKey] || Object.keys(prev[currentWeekKey]).length === 0) {
                return { ...prev, [currentWeekKey]: {} };
              }
              return prev;
            });
          }
        } else {
          console.log('No week ID found for the current date');
          setTimeEntries(prev => {
            return { ...prev, [currentWeekKey]: {} };
          });
        }
      } catch (error) {
        console.error('Error loading timesheet data:', error);
      }
    }
  }, [viewedUser, currentDate, customWeeks, userWeeks, hourEntryStatusNames]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  return (
    <div className="container mx-auto p-4 pt-16">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"ghost"}
                className={
                  "w-[220px] justify-start text-left font-normal" +
                  (!date ? " text-muted-foreground" : "")
                }
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    `${format(date.from, "yyyy-MM-dd")} - ${format(
                      date.to,
                      "yyyy-MM-dd"
                    )}`
                  ) : (
                    format(date.from, "yyyy-MM-dd")
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                defaultMonth={currentDate}
                selected={date}
                onSelect={setDate}
                onDayClick={handleDateSelect}
                numberOfMonths={1}
                pagedNavigation
                className="border-0 rounded-md"
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {userRole === 'admin' && (
            <Label htmlFor="admin-override" className="mr-2">
              Admin Override:
            </Label>
          )}
          {userRole === 'admin' && (
            <Input
              type="checkbox"
              id="admin-override"
              checked={adminOverride}
              onChange={(e) => setAdminOverride(e.target.checked)}
              className="mr-4"
            />
          )}
          {userRole === 'admin' && (
            <Select onValueChange={(userId) => {
              const selectedUser = users.find(u => u.id === userId);
              if (selectedUser) {
                setViewedUser(selectedUser);
                setSearchParams({ userId: userId });
              }
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select User" defaultValue={viewedUser.id} />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" onClick={() => setShowSettings(!showSettings)}>
            {showSettings ? 'Hide Settings' : 'Show Settings'}
          </Button>
        </div>
      </div>
      <TimeSheetGrid
        clients={clients.map(c => c.name)}
        mediaTypes={availableMediaTypes}
        timeEntries={timeEntries[format(currentDate, 'yyyy-MM-dd')] || {}}
        onTimeUpdate={handleTimeUpdate}
        status={status}
        weekHours={weekHours}
        weekPercentage={weekPercentage}
        showSettings={showSettings}
        onAddClient={handleAddClient}
        onRemoveClient={handleRemoveClient}
        onAddMediaType={handleAddMediaType}
        onRemoveMediaType={handleRemoveMediaType}
        onSaveVisibleClients={handleSaveVisibleClients}
        onSaveVisibleMediaTypes={handleSaveVisibleMediaTypes}
        userRole={userRole}
        availableClients={availableClients}
        availableMediaTypes={availableMediaTypes}
        selectedClients={selectedClients}
        selectedMediaTypes={selectedMediaTypes}
        onSelectClient={handleSelectClient}
        onSelectMediaType={handleSelectMediaType}
        isViewingOwnTimesheet={isViewingOwnTimesheet}
        clientObjects={clients}
        adminOverride={adminOverride}
        onReorderClients={handleReorderClients}
        onReorderMediaTypes={handleReorderMediaTypes}
        currentUserId={viewedUser.id}
        isUserHead={isUserHead}
      />
    </div>
  );
};

export default TimeSheet;
