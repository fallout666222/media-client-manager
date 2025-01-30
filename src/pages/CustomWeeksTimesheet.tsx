import { useState } from "react";
import { format, parse } from "date-fns";
import { TimeSheetGrid } from "@/components/TimeSheet/TimeSheetGrid";
import { TimeSheetHeader } from "@/components/TimeSheet/TimeSheetHeader";
import { TimeSheetControls } from "@/components/TimeSheet/TimeSheetControls";
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeEntries, setTimeEntries] = useState<Record<string, Record<string, Record<string, TimeEntry>>>>({});
  const [weekStatuses, setWeekStatuses] = useState<Record<string, TimeSheetStatus>>({});
  const [submittedWeeks, setSubmittedWeeks] = useState<string[]>([]);
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
          [mediaType]: { hours, status: weekStatuses[weekKey] || 'unconfirmed' }
        }
      }
    }));
  };

  const getCurrentWeekStatus = (): TimeSheetStatus => {
    return weekStatuses[selectedWeek] || 'unconfirmed';
  };

  const getTotalHoursForWeek = (): number => {
    if (!selectedWeek || !timeEntries[selectedWeek]) return 0;
    
    return Object.values(timeEntries[selectedWeek]).reduce((clientSum, mediaEntries) => {
      return clientSum + Object.values(mediaEntries).reduce((mediaSum, entries) => {
        return mediaSum + Object.values(entries).reduce((sum, entry) => sum + (entry.hours || 0), 0);
      }, 0);
    }, 0);
  };

  const findFirstUnsubmittedWeek = (): string | null => {
    const sortedWeeks = DEFAULT_WEEKS
      .map(week => week.id)
      .sort((a, b) => {
        const dateA = parse(DEFAULT_WEEKS.find(w => w.id === a)?.startDate || '', 'yyyy-MM-dd', new Date());
        const dateB = parse(DEFAULT_WEEKS.find(w => w.id === b)?.startDate || '', 'yyyy-MM-dd', new Date());
        return dateA.getTime() - dateB.getTime();
      });

    return sortedWeeks.find(weekId => !submittedWeeks.includes(weekId)) || null;
  };

  const handleSubmitForReview = () => {
    const firstUnsubmittedWeek = findFirstUnsubmittedWeek();
    const totalHours = getTotalHoursForWeek();
    
    if (totalHours !== 40) {
      toast({
        title: "Cannot Submit Timesheet",
        description: `Total hours must be 40. Current total: ${totalHours} hours`,
        variant: "destructive"
      });
      return;
    }
    
    if (firstUnsubmittedWeek && firstUnsubmittedWeek !== selectedWeek) {
      const unsubmittedWeekData = DEFAULT_WEEKS.find(w => w.id === firstUnsubmittedWeek);
      toast({
        title: "Cannot Submit This Week",
        description: `Please submit the week of ${unsubmittedWeekData?.startDate} first`,
        variant: "destructive"
      });
      setSelectedWeek(firstUnsubmittedWeek);
      return;
    }

    setSubmittedWeeks(prev => [...prev, selectedWeek]);
    setWeekStatuses(prev => ({
      ...prev,
      [selectedWeek]: 'under-review'
    }));
  };

  const handleApprove = () => {
    setWeekStatuses(prev => ({
      ...prev,
      [selectedWeek]: 'accepted'
    }));
  };

  const handleReject = () => {
    setWeekStatuses(prev => ({
      ...prev,
      [selectedWeek]: 'needs-revision'
    }));
    setSubmittedWeeks(prev => prev.filter(week => week !== selectedWeek));
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
          <>
            <TimeSheetHeader
              userRole={userRole}
              remainingHours={40 - getTotalHoursForWeek()}
              status={getCurrentWeekStatus()}
              onReturnToFirstWeek={() => {
                const firstUnsubmitted = findFirstUnsubmittedWeek();
                if (firstUnsubmitted) {
                  setSelectedWeek(firstUnsubmitted);
                }
              }}
              onToggleSettings={() => {}}
              onExportToExcel={() => {
                toast({
                  title: "Export Started",
                  description: "Your timesheet is being exported to Excel",
                });
              }}
            />

            <TimeSheetControls
              currentDate={currentDate}
              onWeekChange={setCurrentDate}
              status={getCurrentWeekStatus()}
              isManager={userRole === 'manager' || userRole === 'admin'}
              onSubmitForReview={handleSubmitForReview}
              onApprove={handleApprove}
              onReject={handleReject}
              isCustomWeek={true}
              onWeekTypeChange={() => {}}
            />

            <TimeSheetGrid
              clients={clients}
              mediaTypes={mediaTypes}
              timeEntries={timeEntries[selectedWeek] || {}}
              onTimeUpdate={handleTimeUpdate}
              status={getCurrentWeekStatus()}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default CustomWeeksTimesheet;