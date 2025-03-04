
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
import { Trash2, ArrowLeft, Pencil } from "lucide-react";
import { Link } from "react-router-dom";

interface CustomWeek {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  hours: number;
}

const DEFAULT_WEEKS: CustomWeek[] = [
  { id: "1", name: "Week 1", startDate: "2025-01-01", endDate: "2025-01-06", hours: 48 },
  { id: "2", name: "Week 2", startDate: "2025-01-10", endDate: "2025-01-03", hours: 40 },
  { id: "3", name: "Week 3", startDate: "2025-01-13", endDate: "2025-01-17", hours: 40 },
  { id: "4", name: "Week 4", startDate: "2025-01-20", endDate: "2025-01-24", hours: 40 },
  { id: "5", name: "Week 5", startDate: "2025-01-27", endDate: "2025-01-31", hours: 40 },
];

const CustomWeeks = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [name, setName] = useState("");
  const [hours, setHours] = useState<number>(0);
  const [weeks, setWeeks] = useState<CustomWeek[]>(DEFAULT_WEEKS);
  const [editingWeekId, setEditingWeekId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const { toast } = useToast();

  const calculateHours = (start: string, end: string) => {
    try {
      const startDateObj = parse(start, "yyyy-MM-dd", new Date());
      const endDateObj = parse(end, "yyyy-MM-dd", new Date());
      const days = differenceInDays(endDateObj, startDateObj) + 1;
      return days * 8; // 8 часов в день по умолчанию
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

  const handleDelete = (id: string) => {
    setWeeks(prev => prev.filter(week => week.id !== id));
    toast({
      title: "Success",
      description: "Custom week deleted successfully",
    });
  };

  const startEditing = (week: CustomWeek) => {
    setEditingWeekId(week.id);
    setEditName(week.name);
  };

  const saveWeekName = () => {
    if (!editingWeekId) return;
    
    setWeeks(prev => prev.map(week => 
      week.id === editingWeekId ? { ...week, name: editName } : week
    ));
    
    setEditingWeekId(null);
    setEditName("");
    
    toast({
      title: "Success",
      description: "Week name updated successfully",
    });
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

    if (hours <= 0) {
      toast({
        title: "Error",
        description: "Hours must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    const newWeek: CustomWeek = {
      id: crypto.randomUUID(),
      name: name || `Week ${weeks.length + 1}`,
      startDate,
      endDate,
      hours,
    };

    setWeeks(prev => [...prev, newWeek]);
    setStartDate("");
    setEndDate("");
    setName("");
    setHours(0);

    toast({
      title: "Success",
      description: "Custom week added successfully",
    });
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
              placeholder="Week name"
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Week Name</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weeks.map((week) => (
              <TableRow key={week.id}>
                <TableCell>
                  {editingWeekId === week.id ? (
                    <div className="flex items-center gap-2">
                      <Input 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full" 
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={saveWeekName}
                      >
                        Save
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {week.name}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEditing(week)}
                        className="h-6 w-6"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </TableCell>
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CustomWeeks;
