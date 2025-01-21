import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";
import { Home, Trash2 } from "lucide-react";

interface CustomWeek {
  id: string;
  startDate: string;
  endDate: string;
  days: number;
  hours: number;
}

const CustomWeeks = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState<number>(0);
  const [hours, setHours] = useState<number>(0);
  const [weeks, setWeeks] = useState<CustomWeek[]>([]);
  const [useCustomWeeks, setUseCustomWeeks] = useState(false);
  const { toast } = useToast();

  const calculateDays = (start: string, end: string) => {
    try {
      const startDateObj = parse(start, "yyyy-MM-dd", new Date());
      const endDateObj = parse(end, "yyyy-MM-dd", new Date());
      return differenceInDays(endDateObj, startDateObj) + 1;
    } catch {
      return 0;
    }
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
    if (endDate) {
      const calculatedDays = calculateDays(e.target.value, endDate);
      setDays(calculatedDays);
      setHours(calculatedDays * 8); // Default 8 hours per day
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
    if (startDate) {
      const calculatedDays = calculateDays(startDate, e.target.value);
      setDays(calculatedDays);
      setHours(calculatedDays * 8); // Default 8 hours per day
    }
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHours(Number(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please fill in both start and end dates",
        variant: "destructive",
      });
      return;
    }

    const calculatedDays = calculateDays(startDate, endDate);
    if (calculatedDays <= 0) {
      toast({
        title: "Error",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }

    const newWeek: CustomWeek = {
      id: crypto.randomUUID(),
      startDate,
      endDate,
      days: calculatedDays,
      hours,
    };

    setWeeks(prev => [...prev, newWeek]);
    setStartDate("");
    setEndDate("");
    setDays(0);
    setHours(0);

    toast({
      title: "Success",
      description: "Custom week added successfully",
    });
  };

  const handleDelete = (id: string) => {
    setWeeks(prev => prev.filter(week => week.id !== id));
    toast({
      title: "Success",
      description: "Custom week deleted successfully",
    });
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Custom Weeks Management</h1>
        <Link to="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="custom-weeks"
          checked={useCustomWeeks}
          onCheckedChange={setUseCustomWeeks}
        />
        <label htmlFor="custom-weeks" className="text-sm font-medium">
          Use Custom Weeks
        </label>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <label htmlFor="days" className="block text-sm font-medium">
              Days
            </label>
            <Input
              id="days"
              type="number"
              value={days}
              readOnly
              className="w-full bg-gray-50"
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
            />
          </div>
        </div>
        
        <Button type="submit">Add Custom Week</Button>
      </form>

      <div className="mt-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weeks.map((week) => (
              <TableRow key={week.id}>
                <TableCell>
                  {format(parse(week.startDate, "yyyy-MM-dd", new Date()), "MMM dd, yyyy")}
                </TableCell>
                <TableCell>
                  {format(parse(week.endDate, "yyyy-MM-dd", new Date()), "MMM dd, yyyy")}
                </TableCell>
                <TableCell>{week.days}</TableCell>
                <TableCell>{week.hours}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(week.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CustomWeeks;