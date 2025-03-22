
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { differenceInDays, parse, getMonth, getYear, isWithinInterval } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { CustomWeek } from "@/types/timesheet";
import { createCustomWeek } from "@/integrations/supabase/database";

interface AddCustomWeekFormProps {
  weeks: CustomWeek[];
  onWeekAdded: (week: CustomWeek) => void;
}

export const AddCustomWeekForm = ({ weeks, onWeekAdded }: AddCustomWeekFormProps) => {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hours, setHours] = useState<number>(0);
  const { toast } = useToast();

  const calculateHours = (start: string, end: string) => {
    try {
      const startDateObj = parse(start, "yyyy-MM-dd", new Date());
      const endDateObj = parse(end, "yyyy-MM-dd", new Date());
      const days = differenceInDays(endDateObj, startDateObj) + 1;
      return days * 8;
    } catch {
      return 0;
    }
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
    if (endDate) {
      setHours(calculateHours(e.target.value, endDate));
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
    if (startDate) {
      setHours(calculateHours(startDate, e.target.value));
    }
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setHours(isNaN(value) ? 0 : value);
  };

  const checkForOverlaps = (start: string, end: string): boolean => {
    try {
      const newStartDate = parse(start, "yyyy-MM-dd", new Date());
      const newEndDate = parse(end, "yyyy-MM-dd", new Date());
      
      return weeks.some(week => {
        const existingStartDate = parse(week.startDate, "yyyy-MM-dd", new Date());
        const existingEndDate = parse(week.endDate, "yyyy-MM-dd", new Date());
        
        return (
          isWithinInterval(newStartDate, { start: existingStartDate, end: existingEndDate }) ||
          isWithinInterval(newEndDate, { start: existingStartDate, end: existingEndDate }) ||
          (
            newStartDate <= existingStartDate && 
            newEndDate >= existingEndDate
          )
        );
      });
    } catch (error) {
      console.error('Error checking date overlaps:', error);
      return false;
    }
  };

  const areInSameMonth = (start: string, end: string): boolean => {
    try {
      const startDateObj = parse(start, "yyyy-MM-dd", new Date());
      const endDateObj = parse(end, "yyyy-MM-dd", new Date());
      
      return (
        getMonth(startDateObj) === getMonth(endDateObj) &&
        getYear(startDateObj) === getYear(endDateObj)
      );
    } catch (error) {
      console.error('Error checking if dates are in same month:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please provide a name for the week",
        variant: "destructive",
      });
      return;
    }

    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please fill in both start and end dates",
        variant: "destructive",
      });
      return;
    }

    if (hours <= 0) {
      toast({
        title: "Error",
        description: "Hours must be greater than 0",
        variant: "destructive",
      });
      return;
    }
    
    if (!areInSameMonth(startDate, endDate)) {
      toast({
        title: "Error",
        description: "Start date and end date must be in the same month",
        variant: "destructive",
      });
      return;
    }
    
    if (checkForOverlaps(startDate, endDate)) {
      toast({
        title: "Error",
        description: "Date range overlaps with an existing week",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await createCustomWeek({
        name: name.trim(),
        period_from: startDate,
        period_to: endDate,
        required_hours: hours
      });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        const newWeek: CustomWeek = {
          id: data.id,
          name: data.name,
          startDate: data.period_from,
          endDate: data.period_to,
          hours: data.required_hours
        };
        
        onWeekAdded(newWeek);
        setName("");
        setStartDate("");
        setEndDate("");
        setHours(0);
        
        toast({
          title: "Success",
          description: "Custom week added successfully",
        });
      }
    } catch (error) {
      console.error('Error creating custom week:', error);
      toast({
        title: "Error",
        description: "Failed to create custom week",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium">
            Week Name
          </label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Week 1"
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="startDate" className="block text-sm font-medium">
            Start Date
          </label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="endDate" className="block text-sm font-medium">
            End Date
          </label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="hours" className="block text-sm font-medium">
            Hours
          </label>
          <Input
            id="hours"
            type="number"
            value={hours}
            onChange={handleHoursChange}
            className="w-full"
            min="1"
          />
        </div>
      </div>
      
      <Button type="submit">Add Custom Week</Button>
    </form>
  );
};
