import React, { useState } from 'react';
import { parse, format, isAfter, isBefore, startOfWeek } from 'date-fns';
import { TimeSheetManager } from '@/components/TimeSheet/TimeSheetManager';
import { UserSelector } from '@/components/TimeSheet/UserSelector';
import { User } from '@/types/timesheet';
import { useToast } from '@/hooks/use-toast';

interface TimeSheetProps {
  userRole: 'admin' | 'user' | 'manager';
  firstWeek?: string;
  users?: User[];
}

const TimeSheet = ({ userRole, firstWeek = '', users = [] }: TimeSheetProps) => {
  const [currentDate, setCurrentDate] = useState(
    firstWeek ? parse(firstWeek, 'yyyy-MM-dd', new Date()) : new Date()
  );
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const validateWeekSelection = (date: Date): boolean => {
    if (userRole === 'admin') return true;
    
    if (!firstWeek) return false;
    
    const firstWeekDate = parse(firstWeek, 'yyyy-MM-dd', new Date());
    const today = new Date();
    const selectedWeekStart = startOfWeek(date, { weekStartsOn: 1 });

    if (isBefore(selectedWeekStart, firstWeekDate)) {
      toast({
        title: "Invalid Week Selection",
        description: "Cannot select weeks before your first working week",
        variant: "destructive"
      });
      return false;
    }

    if (isAfter(selectedWeekStart, today)) {
      toast({
        title: "Invalid Week Selection",
        description: "Cannot select future weeks",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleWeekChange = (date: Date) => {
    if (validateWeekSelection(date)) {
      setCurrentDate(date);
    }
  };

  return (
    <div className="space-y-6">
      {userRole === 'admin' && (
        <UserSelector
          users={users}
          selectedUser={selectedUser}
          onUserSelect={setSelectedUser}
          open={open}
          setOpen={setOpen}
        />
      )}

      <TimeSheetManager
        userRole={userRole}
        firstWeek={firstWeek}
        currentDate={currentDate}
        onWeekChange={handleWeekChange}
      />
    </div>
  );
};

export default TimeSheet;