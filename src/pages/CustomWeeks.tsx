import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { differenceInDays, parse, format, getYear, isWithinInterval, getMonth } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [weekToDelete, setWeekToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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

  const availableYears = useMemo(() => {
    if (weeks.length === 0) return [];
    
    const years = new Set<string>();
    
    weeks.forEach(week => {
      if (week.startDate) {
        const year = getYear(parse(week.startDate, "yyyy-MM-dd", new Date())).toString();
        years.add(year);
      }
    });
    
    return Array.from(years).sort();
  }, [weeks]);

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

  const openDeleteDialog = (id: string) => {
    setWeekToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (weekToDelete) {
      handleDelete(weekToDelete);
      setIsDeleteDialogOpen(false);
      setWeekToDelete(null);
    }
  };

  const handleDelete = async (id: string) => {
    setWeeks(prev => prev.filter(week => week.id !== id));
    toast({
      title: "Success",
      description: "Custom week deleted from UI (database deletion not implemented yet)",
    });
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

  const filteredWeeks = useMemo(() => {
    if (selectedYear === "all") {
      return weeks;
    }
    
    return weeks.filter(week => {
      if (!week.startDate) return false;
      const year = getYear(parse(week.startDate, "yyyy-MM-dd", new Date())).toString();
      return year === selectedYear;
    });
  }, [weeks, selectedYear]);

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
          <>
            <div className="flex items-center gap-2 mb-4">
              <label className="text-sm font-medium">Filter by year:</label>
              <Select
                value={selectedYear}
                onValueChange={setSelectedYear}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
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
                {filteredWeeks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      {selectedYear !== "all" 
                        ? `No custom weeks found for year ${selectedYear}` 
                        : "No custom weeks found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWeeks.map((week) => (
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
                          onClick={() => openDeleteDialog(week.id)}
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
          </>
        )}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this custom week? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setWeekToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomWeeks;
