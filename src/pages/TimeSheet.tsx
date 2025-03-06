import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { parse, format, isAfter, isBefore, addWeeks, startOfWeek, isEqual, isSameDay } from 'date-fns';
import { TimeSheetStatus, TimeSheetData, User, Client, TimeEntry } from '@/types/timesheet';
import { TimeSheetHeader } from '@/components/TimeSheet/TimeSheetHeader';
import { TimeSheetControls } from '@/components/TimeSheet/TimeSheetControls';
import { TimeSheetContent } from '@/components/TimeSheet/TimeSheetContent';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TeamMemberSelector } from '@/components/TeamMemberSelector';
import { 
  updateWeekHours, 
  updateWeekStatus, 
  getWeekHours, 
  getCustomWeeks, 
  getClients, 
  getMediaTypes, 
  getWeekStatusNames,
  getUserVisibleClients,
  getUserVisibleTypes,
  addUserVisibleClient,
  addUserVisibleType,
  removeUserVisibleClient,
  removeUserVisibleType,
  getWeekStatuses,
  getWeekPercentages
} from '@/integrations/supabase/database';

const DEFAULT_WEEKS = [
  { id: "1", startDate: "2025-01-01", endDate: "2025-01-06", hours: 48 },
  { id: "2", startDate: "2025-01-10", endDate: "2025-01-03", hours: 40 },
  { id: "3", startDate: "2025-01-13", endDate: "2025-01-17", hours: 40 },
  { id: "4", startDate: "2025-01-20", endDate: "2025-01-24", hours: 40 },
  { id: "5", startDate: "2025-01-27", endDate: "2025-01-31", hours: 40 },
];

const DEFAULT_AVAILABLE_MEDIA_TYPES = ['TV', 'Radio', 'Print', 'Digital'];

interface TimeSheetProps {
  userRole: 'admin' | 'user' | 'manager';
  firstWeek: string;
  currentUser: User;
  users: User[];
  clients: Client[];
  readOnly?: boolean;
  impersonatedUser?: User;
  adminOverride?: boolean;
  customWeeks?: any[];
  initialWeekId?: string | null;
}

const TimeSheet = ({ 
  userRole, 
  firstWeek, 
  currentUser, 
  users, 
  clients, 
  readOnly = false,
  impersonatedUser,
  adminOverride = false,
  customWeeks: propCustomWeeks,
  initialWeekId = null
}: TimeSheetProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const [customWeeks, setCustomWeeks] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (userRole === 'admin' && (!firstWeek || firstWeek === 'null') && !currentUser.firstCustomWeekId) {
      return parse("2024-01-01", 'yyyy-MM-dd', new Date());
    }
    if (currentUser.firstCustomWeekId) {
      return new Date();
    }
    return parse(firstWeek, 'yyyy-MM-dd', new Date());
  });
  const [currentCustomWeek, setCurrentCustomWeek] = useState<any>(null);
  const [viewedUser, setViewedUser] = useState<User>(impersonatedUser || currentUser);
  const [weekPercentage, setWeekPercentage] = useState<number>(100);
  const isViewingOwnTimesheet = impersonatedUser ? adminOverride : viewedUser.id === currentUser.id;

  useEffect(() => {
    const fetchCustomWeeks = async () => {
      try {
        let weeksData;
        
        if (propCustomWeeks && propCustomWeeks.length > 0) {
          weeksData = propCustomWeeks;
          console.log(`Using ${weeksData.length} custom weeks from props`);
        } else {
          const { data } = await getCustomWeeks();
          weeksData = data || [];
          console.log(`Fetched ${weeksData.length} custom weeks from database`);
        }
        
        setCustomWeeks(weeksData);
        
        if (initialWeekId && weeksData.length > 0) {
          const initialWeek = weeksData.find((week: any) => week.id === initialWeekId);
          if (initialWeek) {
            console.log(`Setting initial week to: ${initialWeek.name}`);
            setCurrentDate(parse(initialWeek.period_from, 'yyyy-MM-dd', new Date()));
            setCurrentCustomWeek(initialWeek);
          }
        } else if (currentUser.firstCustomWeekId) {
          const userFirstWeek = weeksData.find((week: any) => week.id === currentUser.firstCustomWeekId);
          if (userFirstWeek) {
            setCurrentDate(parse(userFirstWeek.period_from, 'yyyy-MM-dd', new Date()));
            setCurrentCustomWeek(userFirstWeek);
          }
        }
      } catch (error) {
        console.error('Error fetching custom weeks:', error);
      }
    };
    
    fetchCustomWeeks();
  }, [currentUser.firstCustomWeekId, propCustomWeeks, initialWeekId]);

  useEffect(() => {
    const fetchUserVisibles = async () => {
      if (currentUser.id) {
        try {
          const { data: visibleClientsData } = await getUserVisibleClients(currentUser.id);
          if (visibleClientsData) {
            const clientNames = visibleClientsData.map(vc => vc.client.name);
            setSelectedClients(clientNames);
          }
          
          const { data: visibleTypesData } = await getUserVisibleTypes(currentUser.id);
          if (visibleTypesData) {
            const typeNames = visibleTypesData.map(vt => vt.type.name);
            setSelectedMediaTypes(typeNames);
          }
        } catch (error) {
          console.error('Error fetching user visibles:', error);
        }
      }
    };
    
    fetchUserVisibles();
  }, [currentUser.id]);

  useEffect(() => {
    const fetchWeekPercentage = async () => {
      if (!viewedUser.id || !currentCustomWeek) return;
      
      try {
        const { data } = await getWeekPercentages(viewedUser.id);
        if (data && data.length > 0) {
          const currentWeekPercentage = data.find(wp => 
            wp.week_id === currentCustomWeek.id
          );
          
          if (currentWeekPercentage) {
            setWeekPercentage(Number(currentWeekPercentage.percentage));
          } else {
            const weeks = customWeeks.length > 0 ? customWeeks : DEFAULT_WEEKS;
            const sortedWeeks = [...weeks].sort((a, b) => {
              const dateA = new Date(a.period_from || a.startDate);
              const dateB = new Date(b.period_from || b.startDate);
              return dateA.getTime() - dateB.getTime();
            });
            
            const currentWeekIndex = sortedWeeks.findIndex(week => 
              week.id === currentCustomWeek.id
            );
            
            if (currentWeekIndex > 0) {
              for (let i = currentWeekIndex - 1; i >= 0; i--) {
                const prevWeek = sortedWeeks[i];
                const prevWeekPercentage = data.find(wp => 
                  wp.week_id === prevWeek.id
                );
                
                if (prevWeekPercentage) {
                  setWeekPercentage(Number(prevWeekPercentage.percentage));
                  break;
                }
              }
            } else {
              setWeekPercentage(100);
            }
          }
        } else {
          setWeekPercentage(100);
        }
      } catch (error) {
        console.error('Error fetching week percentage:', error);
        setWeekPercentage(100);
      }
    };
    
    fetchWeekPercentage();
  }, [viewedUser.id, currentCustomWeek, customWeeks]);

  const [weekHours, setWeekHours] = useState(() => {
    const initialWeek = DEFAULT_WEEKS.find(week => 
      isSameDay(parse(week.startDate, 'yyyy-MM-dd', new Date()), parse(firstWeek, 'yyyy-MM-dd', new Date()))
    );
    return initialWeek?.hours || 40;
  });

  const availableClients = clients.filter(client => !client.hidden).map(client => client.name);
  const [availableMediaTypes, setAvailableMediaTypes] = useState<string[]>(DEFAULT_AVAILABLE_MEDIA_TYPES);

  const [selectedClients, setSelectedClients] = useState<string[]>(availableClients);
  const [selectedMediaTypes, setSelectedMediaTypes] = useState<string[]>(DEFAULT_AVAILABLE_MEDIA_TYPES);

  const [timeEntries, setTimeEntries] = useState<Record<string, TimeSheetData>>({});
  const [submittedWeeks, setSubmittedWeeks] = useState<string[]>([]);
  const [weekStatuses, setWeekStatuses] = useState<Record<string, TimeSheetStatus>>({});
  const { toast } = useToast();

  useEffect(() => {
    const loadWeekStatuses = async () => {
      if (viewedUser.id && customWeeks.length > 0) {
        try {
          const { data } = await getWeekStatuses(viewedUser.id);
          
          if (data && data.length > 0) {
            const statuses: Record<string, TimeSheetStatus> = {};
            const submitted: string[] = [];
            
            data.forEach(statusEntry => {
              if (statusEntry.week && statusEntry.status) {
                const weekKey = statusEntry.week.period_from;
                statuses[weekKey] = statusEntry.status.name as TimeSheetStatus;
                
                if (statusEntry.status.name === 'under-review' || statusEntry.status.name === 'accepted') {
                  submitted.push(weekKey);
                }
              }
            });
            
            setWeekStatuses(statuses);
            setSubmittedWeeks(submitted);
          }
        } catch (error) {
          console.error('Error loading week statuses:', error);
        }
      }
    };
    
    loadWeekStatuses();
  }, [viewedUser.id, customWeeks]);

  const getUserWeeks = () => {
    const firstWeekDate = parse(firstWeek, 'yyyy-MM-dd', new Date());
    return DEFAULT_WEEKS.filter(week => {
      const weekStartDate = parse(week.startDate, 'yyyy-MM-dd', new Date());
      return !isBefore(weekStartDate, firstWeekDate);
    }).sort((a, b) => {
      const dateA = parse(a.startDate, 'yyyy-MM-dd', new Date());
      const dateB = parse(b.startDate, 'yyyy-MM-dd', new Date());
      return dateA.getTime() - dateB.getTime();
    });
  };

  const userWeeks = getUserWeeks();

  const findFirstUnsubmittedWeek = () => {
    if (customWeeks.length > 0) {
      let userFirstWeekDate: Date | null = null;
      
      if (viewedUser.firstCustomWeekId) {
        const userFirstCustomWeek = customWeeks.find(week => week.id === viewedUser.firstCustomWeekId);
        if (userFirstCustomWeek) {
          userFirstWeekDate = parse(userFirstCustomWeek.period_from, 'yyyy-MM-dd', new Date());
        }
      } else if (viewedUser.firstWeek) {
        userFirstWeekDate = parse(viewedUser.firstWeek, 'yyyy-MM-dd', new Date());
      }
      
      if (userFirstWeekDate) {
        const sortedWeeks = [...customWeeks].sort((a, b) => {
          const dateA = parse(a.period_from, 'yyyy-MM-dd', new Date());
          const dateB = parse(b.period_from, 'yyyy-MM-dd', new Date());
          return dateA.getTime() - dateB.getTime();
        });
        
        const userWeeks = sortedWeeks.filter(week => {
          const weekDate = parse(week.period_from, 'yyyy-MM-dd', new Date());
          return !isBefore(weekDate, userFirstWeekDate as Date);
        });
        
        for (const week of userWeeks) {
          if (!submittedWeeks.includes(week.period_from)) {
            console.log(`Found first unsubmitted week: ${week.name} (${week.period_from})`);
            return {
              date: parse(week.period_from, 'yyyy-MM-dd', new Date()),
              weekData: week
            };
          }
        }
      }
    }
    
    if (!adminOverride) {
      const userWeeks = getUserWeeks();
      for (const week of userWeeks) {
        const weekKey = week.startDate;
        if (!submittedWeeks.includes(weekKey)) {
          return {
            date: parse(weekKey, 'yyyy-MM-dd', new Date()),
            weekData: week
          };
        }
      }
    }
    
    return null;
  };

  const handleReturnToFirstUnsubmittedWeek = () => {
    const firstUnsubmitted = findFirstUnsubmittedWeek();
    if (firstUnsubmitted) {
      setCurrentDate(firstUnsubmitted.date);
      
      if (firstUnsubmitted.weekData) {
        if ('required_hours' in firstUnsubmitted.weekData) {
          setWeekHours(firstUnsubmitted.weekData.required_hours);
          setCurrentCustomWeek(firstUnsubmitted.weekData);
        } else {
          setWeekHours(firstUnsubmitted.weekData.hours);
          setCurrentCustomWeek(null);
        }
      }
      
      toast({
        title: "Navigated to First Unsubmitted Week",
        description: `Showing week of ${format(firstUnsubmitted.date, 'MMM d, yyyy')}`,
      });
    } else {
      toast({
        title: "No Unsubmitted Weeks",
        description: adminOverride 
          ? "There are no unsubmitted weeks in the database for this user" 
          : "All your weeks have been submitted",
      });
    }
  };

  const getCurrentWeekStatus = (): TimeSheetStatus => {
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    return weekStatuses[currentWeekKey] || 'unconfirmed';
  };

  const getTotalHoursForWeek = (): number => {
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    const weekEntries = timeEntries[currentWeekKey] || {};
    
    return Object.values(weekEntries).reduce((clientSum, mediaEntries) => {
      return clientSum + Object.values(mediaEntries).reduce((mediaSum, entry) => {
        return mediaSum + (entry.hours || 0);
      }, 0);
    }, 0);
  };

  const handleSubmitForReview = async () => {
    if (readOnly && !adminOverride) return;
    
    const firstUnsubmittedWeek = findFirstUnsubmittedWeek();
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    const totalHours = getTotalHoursForWeek();
    
    const effectiveHours = Math.round(weekHours * (weekPercentage / 100));
    const remainingHours = effectiveHours - totalHours;
    
    if (remainingHours !== 0) {
      toast({
        title: "Cannot Submit Timesheet",
        description: `You must fill in exactly ${effectiveHours} hours for this week (${weekPercentage}% of ${weekHours}). Remaining: ${remainingHours} hours`,
        variant: "destructive"
      });
      return;
    }
    
    if (firstUnsubmittedWeek && !isSameDay(firstUnsubmittedWeek.date, currentDate)) {
      toast({
        title: "Cannot Submit This Week",
        description: `Week not submitted because previous weeks haven't been filled in yet.`,
        variant: "destructive"
      });
      
      const unsubmittedWeek = userWeeks.find(week => 
        isSameDay(parse(week.startDate, 'yyyy-MM-dd', new Date()), firstUnsubmittedWeek.date)
      );
      setCurrentDate(firstUnsubmittedWeek.date);
      if (unsubmittedWeek) {
        setWeekHours(unsubmittedWeek.hours);
      }
      
      return;
    }

    try {
      const currentWeekData = currentCustomWeek || 
        userWeeks.find(w => format(parse(w.startDate, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') === currentWeekKey);
      
      if (currentWeekData && currentUser.id) {
        const { data: statusNames } = await getWeekStatusNames();
        const underReviewStatus = statusNames?.find(status => status.name === 'under-review');
        
        if (underReviewStatus) {
          const submittedWeekData = { ...currentWeekData };
          
          await updateWeekStatus(currentUser.id, currentWeekData.id, underReviewStatus.id);
          
          const weekEntries = timeEntries[currentWeekKey] || {};
          const { data: clientsData } = await getClients();
          const { data: mediaTypesData } = await getMediaTypes();
          
          console.log("Saving time entries for week:", currentWeekData.id);
          
          for (const clientName in weekEntries) {
            const mediaEntries = weekEntries[clientName];
            const clientObj = clientsData?.find(c => c.name === clientName);
            
            if (clientObj) {
              for (const mediaTypeName in mediaEntries) {
                const entry = mediaEntries[mediaTypeName];
                const mediaTypeObj = mediaTypesData?.find(m => m.name === mediaTypeName);
                
                if (mediaTypeObj && entry.hours > 0) {
                  console.log(`Saving hours for ${clientName}/${mediaTypeName}: ${entry.hours}`);
                  await updateWeekHours(
                    currentUser.id, 
                    currentWeekData.id, 
                    clientObj.id, 
                    mediaTypeObj.id, 
                    entry.hours
                  );
                }
              }
            }
          }
          
          setWeekStatuses(prev => ({
            ...prev,
            [currentWeekKey]: 'under-review'
          }));
          
          setSubmittedWeeks(prev => {
            if (!prev.includes(currentWeekKey)) {
              return [...prev, currentWeekKey];
            }
            return prev;
          });
          
          const updatedEntries = { ...timeEntries };
          if (updatedEntries[currentWeekKey]) {
            for (const client in updatedEntries[currentWeekKey]) {
              for (const mediaType in updatedEntries[currentWeekKey][client]) {
                if (updatedEntries[currentWeekKey][client][mediaType]) {
                  updatedEntries[currentWeekKey][client][mediaType].status = 'under-review';
                }
              }
            }
            setTimeEntries(updatedEntries);
          }
          
          toast({
            title: "Timesheet Under Review",
            description: `Week of ${format(currentDate, 'MMM d, yyyy')} has been submitted and is now under review`,
          });
        }
      }
    } catch (error) {
      console.error('Error updating week status:', error);
      toast({
        title: "Error",
        description: "Failed to update timesheet status",
        variant: "destructive"
      });
    }
  };

  const handleApprove = async () => {
    if (readOnly && !adminOverride) return;
    
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    
    try {
      const currentWeekData = currentCustomWeek || 
        userWeeks.find(w => format(parse(w.startDate, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') === currentWeekKey);
      
      if (currentWeekData && viewedUser.id) {
        const { data: statusNames } = await getWeekStatusNames();
        const acceptedStatus = statusNames?.find(status => status.name === 'accepted');
        
        if (acceptedStatus) {
          await updateWeekStatus(viewedUser.id, currentWeekData.id, acceptedStatus.id);
          
          setWeekStatuses(prev => ({
            ...prev,
            [currentWeekKey]: 'accepted'
          }));
          
          toast({
            title: "Timesheet Approved",
            description: `Week of ${format(currentDate, 'MMM d, yyyy')} has been approved`,
          });
        }
      }
    } catch (error) {
      console.error('Error approving timesheet:', error);
      toast({
        title: "Error",
        description: "Failed to approve timesheet",
        variant: "destructive"
      });
    }
  };

  const handleReject = async () => {
    if (readOnly && !adminOverride) return;
    
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    
    try {
      const currentWeekData = currentCustomWeek || 
        userWeeks.find(w => format(parse(w.startDate, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') === currentWeekKey);
      
      if (currentWeekData && viewedUser.id) {
        const { data: statusNames } = await getWeekStatusNames();
        const needsRevisionStatus = statusNames?.find(status => status.name === 'needs-revision');
        
        if (needsRevisionStatus) {
          await updateWeekStatus(viewedUser.id, currentWeekData.id, needsRevisionStatus.id);
          
          setWeekStatuses(prev => ({
            ...prev,
            [currentWeekKey]: 'needs-revision'
          }));
          
          setSubmittedWeeks(prev => prev.filter(week => week !== currentWeekKey));
          
          toast({
            title: "Timesheet Rejected",
            description: `Week of ${format(currentDate, 'MMM d, yyyy')} needs revision`,
          });
        }
      }
    } catch (error) {
      console.error('Error rejecting timesheet:', error);
      toast({
        title: "Error",
        description: "Failed to reject timesheet",
        variant: "destructive"
      });
    }
  };

  const hasUnsubmittedEarlierWeek = () => {
    if (!customWeeks.length || !currentCustomWeek) return false;
    
    const userFirstWeek = customWeeks.find(week => week.id === viewedUser.firstCustomWeekId);
    if (!userFirstWeek) return false;
    
    const sortedWeeks = [...customWeeks].sort((a, b) => {
      const dateA = parse(a.period_from, 'yyyy-MM-dd', new Date());
      const dateB = parse(b.period_from, 'yyyy-MM-dd', new Date());
      return dateA.getTime() - dateB.getTime();
    });
    
    const currentIndex = sortedWeeks.findIndex(week => week.id === currentCustomWeek.id);
    if (currentIndex <= 0) return false; // First week or week not found
    
    const userFirstWeekIndex = sortedWeeks.findIndex(week => week.id === userFirstWeek.id);
    if (userFirstWeekIndex === -1) return false;
    
    for (let i = userFirstWeekIndex; i < currentIndex; i++) {
      const weekKey = sortedWeeks[i].period_from;
      if (weekKey && !submittedWeeks.includes(weekKey)) {
        return true;
      }
    }
    
    return false;
  }

  const isCurrentWeekSubmitted = () => {
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    return submittedWeeks.includes(currentWeekKey) || 
           weekStatuses[currentWeekKey] === 'under-review' || 
           weekStatuses[currentWeekKey] === 'accepted';
  }

  const handleSelectClient = (client: string) => {
    if (!selectedClients.includes(client)) {
      setSelectedClients(prev => [...prev, client]);
    }
  };

  const handleSelectMediaType = (type: string) => {
    if (!selectedMediaTypes.includes(type)) {
      setSelectedMediaTypes(prev => [...prev, type]);
    }
  };

  const handleAddClient = (client: string) => {
    if (userRole !== 'admin') return;
    
    if (!availableClients.includes(client)) {
      toast({
        title: "Client Management Moved",
        description: "Please add new clients from the Client Tree page",
      });
    }
  };

  const handleAddMediaType = (type: string) => {
    if (userRole !== 'admin') return;
    
    if (!availableMediaTypes.includes(type)) {
      setAvailableMediaTypes(prev => [...prev, type]);
      setSelectedMediaTypes(prev => [...prev, type]);
    }
  };

  const handleRemoveClient = (client: string) => {
    if (readOnly) return;
    setSelectedClients(prev => prev.filter(c => c !== client));
  };

  const handleRemoveMediaType = (type: string) => {
    if (readOnly) return;
    
    if (userRole === 'admin') {
      setAvailableMediaTypes(prev => prev.filter(t => t !== type));
    }
    
    setSelectedMediaTypes(prev => prev.filter(t => t !== type));
  };

  const handleWeekHoursChange = (hours: number) => {
    setWeekHours(hours);
  };

  useEffect(() => {
    const loadUserData = async () => {
      if (viewedUser.id) {
        try {
          const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
          
          let weekId = null;
          const customWeek = customWeeks.find(week => 
            format(parse(week.period_from, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') === currentWeekKey
          );
          
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
          
          if (weekId) {
            console.log(`Loading time entries for user ${viewedUser.id}, week ${weekId}`);
            const { data: hourEntries } = await getWeekHours(viewedUser.id, weekId);
            
            if (hourEntries && hourEntries.length > 0) {
              console.log(`Found ${hourEntries.length} time entries`);
              const entries: Record<string, TimeSheetData> = {};
              entries[currentWeekKey] = {};
              
              hourEntries.forEach(entry => {
                if (entry.client && entry.media_type) {
                  if (!entries[currentWeekKey][entry.client.name]) {
                    entries[currentWeekKey][entry.client.name] = {};
                  }
                  
                  entries[currentWeekKey][entry.client.name][entry.media_type.name] = {
                    hours: entry.hours,
                    status: getCurrentWeekStatus()
                  };
                }
              });
              
              setTimeEntries(entries);
            } else {
              console.log('No time entries found for this week');
              setTimeEntries({
                [currentWeekKey]: {}
              });
            }
          }
        } catch (error) {
          console.error('Error loading timesheet data:', error);
        }
      }
    };
    
    loadUserData();
  }, [viewedUser, currentDate]);

  const handleTimeUpdate = async (client: string, mediaType: string, hours: number) => {
    if ((readOnly || !isViewingOwnTimesheet) && !adminOverride) return;
    
    const currentTotal = getTotalHoursForWeek();
    const existingHours = timeEntries[format(currentDate, 'yyyy-MM-dd')]?.[client]?.[mediaType]?.hours || 0;
    const newTotalHours = currentTotal - existingHours + hours;
    
    if (newTotalHours > weekHours) {
      toast({
        title: "Cannot Add Hours",
        description: `Total hours cannot exceed ${weekHours} for this week`,
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (viewedUser.id) {
        const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
        let weekId = null;
        
        const customWeek = customWeeks.find(week => 
          format(parse(week.period_from, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') === currentWeekKey
        );
        
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
        
        if (weekId) {
          console.log(`Updating hours for week ${weekId}, client ${client}, media ${mediaType}: ${hours}`);
          const { data: clientsData } = await getClients();
          const { data: mediaTypesData } = await getMediaTypes();
          
          const clientObj = clientsData?.find(c => c.name === client);
          const mediaTypeObj = mediaTypesData?.find(m => m.name === mediaType);
          
          if (clientObj && mediaTypeObj) {
            await updateWeekHours(viewedUser.id, weekId, clientObj.id, mediaTypeObj.id, hours);
            console.log('Hours updated successfully');
          } else {
            console.error('Client or media type not found', { client, mediaType, clientObj, mediaTypeObj });
          }
        }
      }
      
      const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
      
      setTimeEntries(prev => {
        const newEntries = { ...prev };
        
        if (!newEntries[currentWeekKey]) {
          newEntries[currentWeekKey] = {};
        }
        
        if (!newEntries[currentWeekKey][client]) {
          newEntries[currentWeekKey][client] = {};
        }
        
        newEntries[currentWeekKey][client][mediaType] = { 
          hours, 
          status: getCurrentWeekStatus() 
        };
        
        return newEntries;
      });
    } catch (error) {
      console.error('Error updating hours:', error);
      toast({
        title: "Error",
        description: "Failed to update hours",
        variant: "destructive"
      });
    }
  };

  const handleSaveVisibleClients = async (clients: string[]) => {
    if (!currentUser.id || readOnly) return;
    
    try {
      const { data: clientsData } = await getClients();
      if (!clientsData) return;
      
      const { data: currentVisible } = await getUserVisibleClients(currentUser.id);
      
      const clientMap = new Map(clientsData.map(c => [c.name, c.id]));
      
      for (const clientName of clients) {
        const clientId = clientMap.get(clientName);
        
        if (clientId && !currentVisible?.some(v => v.client_id === clientId)) {
          await addUserVisibleClient(currentUser.id, clientId);
        }
      }
      
      if (currentVisible) {
        for (const visible of currentVisible) {
          const client = clientsData.find(c => c.id === visible.client_id);
          
          if (client && !clients.includes(client.name)) {
            await removeUserVisibleClient(visible.id);
          }
        }
      }
      
      toast({
        title: "Visible Clients Updated",
        description: "Your visible clients have been updated",
      });
    } catch (error) {
      console.error('Error updating visible clients:', error);
      toast({
        title: "Error",
        description: "Failed to update visible clients",
        variant: "destructive"
      });
    }
  };

  const handleSaveVisibleMediaTypes = async (types: string[]) => {
    if (!currentUser.id || readOnly) return;
    
    try {
      const { data: mediaTypesData } = await getMediaTypes();
      if (!mediaTypesData) return;
      
      const { data: currentVisible } = await getUserVisibleTypes(currentUser.id);
      
      const typeMap = new Map(mediaTypesData.map(t => [t.name, t.id]));
      
      for (const typeName of types) {
        const typeId = typeMap.get(typeName);
        
        if (typeId && !currentVisible?.some(v => v.type_id === typeId)) {
          await addUserVisibleType(currentUser.id, typeId);
        }
      }
      
      if (currentVisible) {
        for (const visible of currentVisible) {
          const type = mediaTypesData.find(t => t.id === visible.type_id);
          
          if (type && !types.includes(type.name)) {
            await removeUserVisibleType(visible.id);
          }
        }
      }
      
      toast({
        title: "Visible Media Types Updated",
        description: "Your visible media types have been updated",
      });
    } catch (error) {
      console.error('Error updating visible media types:', error);
      toast({
        title: "Error",
        description: "Failed to update visible media types",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {userRole === 'manager' && !impersonatedUser && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">View Timesheet For:</h3>
          <TeamMemberSelector
            currentUser={currentUser}
            users={users}
            onUserSelect={setViewedUser}
            selectedUser={viewedUser}
          />
        </div>
      )}

      {adminOverride && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Admin Override Mode:</strong> You have full control over this user's timesheet, including submitting, approving, rejecting, and modifying hours regardless of week status.
              </p>
            </div>
          </div>
        </div>
      )}

      <TimeSheetHeader
        userRole={userRole}
        remainingHours={Math.round(weekHours * (weekPercentage / 100)) - getTotalHoursForWeek()}
        status={getCurrentWeekStatus()}
        onReturnToFirstUnsubmittedWeek={handleReturnToFirstUnsubmittedWeek}
        onToggleSettings={() => setShowSettings(!showSettings)}
        firstWeek={viewedUser.firstWeek || firstWeek}
        weekPercentage={weekPercentage}
        weekHours={weekHours}
        hasCustomWeeks={customWeeks.length > 0}
      />

      {hasUnsubmittedEarlierWeek() && !readOnly && !isCurrentWeekSubmitted() && !adminOverride && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            You have unsubmitted timesheets from previous weeks. Please submit them in chronological order.
          </AlertDescription>
        </Alert>
      )}

      <TimeSheetControls
        currentDate={currentDate}
        onWeekChange={(date) => {
          setCurrentDate(date);
          const selectedWeek = customWeeks.find(week => 
            isSameDay(parse(week.period_from, 'yyyy-MM-dd', new Date()), date)
          );
          
          if (selectedWeek) {
            setWeekHours(selectedWeek.required_hours);
            setCurrentCustomWeek(selectedWeek);
          } else {
            const defaultWeek = userWeeks.find(w => 
              isSameDay(parse(w.startDate, 'yyyy-MM-dd', new Date()), date)
            );
            if (defaultWeek) {
              setWeekHours(defaultWeek.hours);
              setCurrentCustomWeek(null);
            }
          }
        }}
        onWeekHoursChange={handleWeekHoursChange}
        status={getCurrentWeekStatus()}
        isManager={userRole === 'manager' || userRole === 'admin'}
        isViewingOwnTimesheet={isViewingOwnTimesheet}
        onSubmitForReview={handleSubmitForReview}
        onApprove={handleApprove}
        onReject={handleReject}
        readOnly={readOnly || (!isViewingOwnTimesheet && userRole !== 'manager' && userRole !== 'admin' && !adminOverride)}
        firstWeek={viewedUser.firstWeek || firstWeek}
        weekId={currentCustomWeek?.id}
        weekPercentage={weekPercentage}
        customWeeks={customWeeks}
        adminOverride={adminOverride}
      />

      <TimeSheetContent
        showSettings={showSettings}
        clients={availableClients}
        mediaTypes={availableMediaTypes}
        timeEntries={timeEntries[format(currentDate, 'yyyy-MM-dd')] || {}}
        status={getCurrentWeekStatus()}
        onTimeUpdate={handleTimeUpdate}
        onAddClient={handleAddClient}
        onRemoveClient={handleRemoveClient}
        onAddMediaType={handleAddMediaType}
        onRemoveMediaType={handleRemoveMediaType}
        onSaveVisibleClients={handleSaveVisibleClients}
        onSaveVisibleMediaTypes={handleSaveVisibleMediaTypes}
        readOnly={readOnly || (!isViewingOwnTimesheet && !adminOverride)}
        weekHours={weekHours}
        weekPercentage={weekPercentage}
        userRole={userRole}
        availableClients={availableClients}
        availableMediaTypes={availableMediaTypes}
        selectedClients={selectedClients}
        selectedMediaTypes={selectedMediaTypes}
        onSelectClient={handleSelectClient}
        onSelectMediaType={handleSelectMediaType}
        isViewingOwnTimesheet={isViewingOwnTimesheet || adminOverride}
        clientObjects={clients}
        adminOverride={adminOverride}
      />
    </div>
  );
};

export default TimeSheet;
