
// Export all database functions from entity modules

// Client operations
export * from './client';

// User operations
export * from './user';

// Department operations
export * from './department';

// Media Type operations
export * from './mediaType';

// Week operations - export everything except the duplicated functions
import * as WeekModule from './week';
export { 
  getWeekStatusNames,
  getWeekStatuses,
  getWeekStatusesChronological,
  updateWeekStatus,
  getWeekPercentages,
  updateWeekPercentage
} from './week';

// Week Hours operations - export everything except the duplicated functions
import * as WeekHoursModule from './weekHours';
export {
  // Re-export only non-duplicate functions from weekHours
} from './weekHours';

// Visible Entity operations (clients and media types visibility)
export * from './visibleEntity';

// Planning Hours operations
export * from './planningHours';

// Planning Versions operations
export * from './planningVersions';

// Version Status operations
export * from './versionStatus';

// Years operations
export * from './years';

// Explicitly re-export the functions that would cause duplicates
// We're choosing the implementations from customWeeks and timesheet over the ones in week and weekHours
export { getCustomWeeks, createCustomWeek } from './customWeeks';
export { getWeekHours, updateWeekHours, updateHours } from './timesheet';
