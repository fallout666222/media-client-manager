import { useState } from "react";
import { format, parse } from "date-fns";
import { TimeSheetGrid } from "@/components/TimeSheet/TimeSheetGrid";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimeEntry, TimeSheetStatus } from "@/types/timesheet";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const DEFAULT_WEEKS = [
  { id: "1", startDate: "2025-01-01", endDate: "2025-01-06", hours: 48 },
  { id: "2", startDate: "2025-01-10", endDate: "2025-01-03", hours: 40 },
  { id: "3", startDate: "2025-01-13", endDate: "2025-01-17", hours: 40 },
  { id: "4", startDate: "2025-01-20", endDate: "2025-01-24", hours: 40 },
  { id: "5", startDate: "2025-01-27", endDate: "2025-01-31", hours: 40 },
];

interface CustomWeeksTimesheetProps {
  userRole: string;
}

const CustomWeeksTimesheet = ({ userRole }: CustomWeeksTimesheetProps) => {
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [timeEntries, setTimeEntries] = useState<Record<string, Record<string, TimeEntry>>>({});
  const { toast } = useToast();

  const clients = [
    'Administrative',
    'Education/Training',
    'General Research',
    'Network Requests',
    'New Business',
    'Sick Leave',
    'VACATION'
  ];

  const mediaTypes = ['TV', 'Radio', 'Print', 'Digital'];

  const handleTimeUpdate = (client: string, mediaType: string, hours: number) => {
    const weekKey = selectedWeek;
    setTimeEntries(prev => ({
      ...prev,
      [weekKey]: {
        ...prev[weekKey],
        [client]: {
          ...prev[weekKey]?.[client],
          [mediaType]: { hours, status: 'unconfirmed' as TimeSheetStatus }
        }
      }
    }));
  };

  const formatWeekLabel = (week: typeof DEFAULT_WEEKS[0]) => {
    const start = format(parse(week.startDate, "yyyy-MM-dd", new Date()), "MMM dd, yyyy");
    const end = format(parse(week.endDate, "yyyy-MM-dd", new Date()), "MMM dd, yyyy");
    return `${start} - ${end} (${week.hours}h)`;
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Custom Weeks Timesheet</h1>
        <Link to="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        <div className="w-full max-w-md">
          <Select
            value={selectedWeek}
            onValueChange={setSelectedWeek}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a custom week" />
            </SelectTrigger>
            <SelectContent>
              {DEFAULT_WEEKS.map((week) => (
                <SelectItem key={week.id} value={week.id}>
                  {formatWeekLabel(week)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedWeek && (
          <div className="mt-6">
            <TimeSheetGrid
              clients={clients}
              mediaTypes={mediaTypes}
              timeEntries={timeEntries[selectedWeek] || {}}
              onTimeUpdate={handleTimeUpdate}
              status="unconfirmed"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomWeeksTimesheet;