
import { useState, useEffect } from "react";
import { parse, isBefore } from 'date-fns';
import * as db from '@/integrations/supabase/database';
import { StatusTimeline, WeekDetails } from "@/components/ProgressBar";
import { handleQueryResult } from '@/integrations/supabase/client';

interface UserProgressBarProps {
  userId: string;
  customWeeks: any[];
  firstWeek: string;
  userRole: string;
  filterYear?: number | null;
}

export function UserProgressBar({
  userId,
  customWeeks,
  firstWeek,
  userRole,
  filterYear = null
}: UserProgressBarProps) {
  const [weeks, setWeeks] = useState<any[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeekStatuses = async () => {
      if (!userId || customWeeks.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        let allAvailableWeeks = [...customWeeks];

        if (userRole !== 'admin' && firstWeek) {
          const firstWeekDate = parse(firstWeek, 'yyyy-MM-dd', new Date());
          allAvailableWeeks = allAvailableWeeks.filter(week => {
            const weekStartDate = parse(week.period_from, 'yyyy-MM-dd', new Date());
            return !isBefore(weekStartDate, firstWeekDate);
          });
        }

        const weekStatusesResult = await db.getWeekStatusesChronological(userId);
        const weekStatuses = handleQueryResult(weekStatusesResult);
        
        let formattedWeeks = [];

        if (weekStatuses && weekStatuses.length > 0) {
          const existingStatusMap = new Map();
          
          weekStatuses.forEach(statusData => {
            // Check if statusData and statusData.week exist before accessing properties
            if (statusData && statusData.week) {
              existingStatusMap.set(statusData.week.id, {
                week: statusData.week.name,
                status: (statusData.status?.name || 'unconfirmed') as 'accepted' | 'under revision' | 'under review' | 'Unconfirmed',
                periodFrom: statusData.week.period_from
              });
            }
          });

          formattedWeeks = allAvailableWeeks.map(week => {
            const existingStatus = existingStatusMap.get(week.id);
            return existingStatus || {
              week: week.name,
              status: 'Unconfirmed' as 'accepted' | 'under revision' | 'under review' | 'Unconfirmed',
              periodFrom: week.period_from
            };
          });

          formattedWeeks.sort((a, b) => {
            const weekA = allAvailableWeeks.find(w => w.name === a.week);
            const weekB = allAvailableWeeks.find(w => w.name === b.week);
            if (!weekA || !weekB) return 0;
            return new Date(weekA.period_from).getTime() - new Date(weekB.period_from).getTime();
          });
        } else {
          formattedWeeks = allAvailableWeeks.map(week => ({
            week: week.name,
            status: 'Unconfirmed' as 'accepted' | 'under revision' | 'under review' | 'Unconfirmed',
            periodFrom: week.period_from
          }));

          formattedWeeks.sort((a, b) => {
            const weekA = allAvailableWeeks.find(w => w.name === a.week);
            const weekB = allAvailableWeeks.find(w => w.name === b.week);
            if (!weekA || !weekB) return 0;
            return new Date(weekA.period_from).getTime() - new Date(weekB.period_from).getTime();
          });
        }

        setWeeks(formattedWeeks);
        setSelectedWeek(formattedWeeks[0] || null);
      } catch (error) {
        console.error('Error fetching week statuses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeekStatuses();
  }, [userId, customWeeks, firstWeek, userRole]);

  const handleSelectWeek = (weekData: any) => {
    setSelectedWeek(weekData);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-12">Loading progress...</div>;
  }

  if (weeks.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <StatusTimeline 
        weeks={weeks} 
        selectedWeek={selectedWeek} 
        onSelectWeek={handleSelectWeek} 
        filterYear={filterYear}
      />
      <WeekDetails weekData={selectedWeek} />
    </div>
  );
}
