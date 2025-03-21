
import React from 'react';

interface TimesheetProps {
  userRole?: string;
  firstWeek?: string;
  currentUser?: any;
  users?: any[];
  clients?: any[];
}

const Timesheet: React.FC<TimesheetProps> = ({ userRole, firstWeek, currentUser, users, clients }) => {
  return (
    <div>
      <h1>Timesheet Page</h1>
    </div>
  );
};

export default Timesheet;
