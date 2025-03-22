
import { useMemo } from "react";
import { format, parse, getYear } from "date-fns";
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
import { CustomWeek } from "@/types/timesheet";

interface CustomWeeksTableProps {
  weeks: CustomWeek[];
  loading: boolean;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
}

export const CustomWeeksTable = ({ 
  weeks, 
  loading, 
  selectedYear, 
  setSelectedYear 
}: CustomWeeksTableProps) => {
  
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

  if (loading) {
    return <div className="text-center p-4">Loading custom weeks...</div>;
  }

  return (
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredWeeks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
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
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </>
  );
};
