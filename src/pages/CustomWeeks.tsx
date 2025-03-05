
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { differenceInDays, parse, format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { CustomWeek } from "@/types/timesheet";
import { getCustomWeeks, createCustomWeek } from "@/integrations/supabase/database";

const CustomWeeks = () => {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hours, setHours] = useState<number>(0);
  const [weeks, setWeeks] = useState<CustomWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchWeeks();
  }, []);

  const fetchWeeks = async () => {
    try {
      setLoading(true);
      const { data, error } = await getCustomWeeks();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Transform data to match the CustomWeek interface
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

  const calculateHours = (start: string, end: string) => {
    try {
      const startDateObj = parse(start, "yyyy-MM-dd", new Date());
      const endDateObj = parse(end, "yyyy-MM-dd", new Date());
      const days = differenceInDays(endDateObj, startDateObj) + 1;
      return days * 8; // 8 hours per day by default
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

  const handleDelete = async (id: string) => {
    // Note: For now, we're just removing from the UI
    // A proper delete API would be needed in the database.ts file
    setWeeks(prev => prev.filter(week => week.id !== id));
    toast({
      title: "Success",
      description: "Custom week deleted from UI (database deletion not implemented yet)",
    });
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
        
        setWeeks(prev => [...prev, newWeek]);
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
    <div className="container mx-auto p-4 space-y-6 pt-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Custom Weeks Management</h1>
        <Link to="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2 z-10">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      
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

      <div className="mt-8">
        {loading ? (
          <div className="text-center p-4">Loading custom weeks...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">No custom weeks found</TableCell>
                </TableRow>
              ) : (
                weeks.map((week) => (
                  <TableRow key={week.id}>
                    <TableCell className="font-medium">{week.name}</TableCell>
                    <TableCell>
                      {format(parse(week.startDate, "yyyy-MM-dd", new Date()), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      {format(parse(week.endDate, "yyyy-MM-dd", new Date()), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>{week.hours}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(week.id)}
                        className="text-destructive hover:text-destructive/90"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default CustomWeeks;
