
import { TimeSheetStatus } from '@/types/timesheet';
import { WeekStatus } from '@/components/ProgressBar';

/**
 * Maps TimeSheetStatus to WeekStatus for use in ProgressBar component
 */
export const mapTimeSheetStatusToWeekStatus = (status: TimeSheetStatus): WeekStatus => {
  switch(status) {
    case 'unconfirmed':
      return 'Unconfirmed';
    case 'under-review':
      return 'under review';
    case 'accepted':
      return 'accepted';
    case 'needs-revision':
      return 'under revision';
    default:
      return 'Unconfirmed';
  }
};

/**
 * Maps WeekStatus to TimeSheetStatus for database operations
 */
export const mapWeekStatusToTimeSheetStatus = (status: WeekStatus): TimeSheetStatus => {
  switch(status) {
    case 'Unconfirmed':
      return 'unconfirmed';
    case 'under review':
      return 'under-review';
    case 'accepted':
      return 'accepted';
    case 'under revision':
      return 'needs-revision';
    default:
      return 'unconfirmed';
  }
};
