
import { useState, useEffect } from "react";
import { getCustomWeeks } from "@/integrations/supabase/database";
import { CustomWeek } from "@/types/timesheet";
import { useToast } from "@/hooks/use-toast";

export const useCustomWeeks = () => {
  const [weeks, setWeeks] = useState<CustomWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchWeeks = async () => {
    try {
      setLoading(true);
      const { data, error } = await getCustomWeeks();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        const formattedWeeks = data.map(week => ({
          id: week.id,
          name: week.name,
          startDate: week.period_from,
          endDate: week.period_to,
          hours: week.required_hours
        }));
        
        setWeeks(formattedWeeks);
      }
    } catch (error) {
      console.error('Error fetching custom weeks:', error);
      toast({
        title: "Error",
        description: "Failed to load custom weeks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeks();
  }, []);

  const addWeek = (week: CustomWeek) => {
    setWeeks(prev => [...prev, week]);
  };

  return {
    weeks,
    loading,
    fetchWeeks,
    addWeek
  };
};
