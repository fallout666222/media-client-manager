
import { User, Client, TimeSheetStatus } from '@/types/timesheet';

export interface TimeSheetContextType {
  showSettings: boolean;
  setShowSettings: React.Dispatch<React.SetStateAction<boolean>>;
  customWeeks: any[];
  viewedUser: User;
  currentDate: Date;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  weekHours: number;
  setWeekHours: React.Dispatch<React.SetStateAction<number>>;
  isViewingOwnTimesheet: boolean;
  availableMediaTypes: string[];
  setAvailableMediaTypes: React.Dispatch<React.SetStateAction<string[]>>;
  availableClients: string[];
  timeEntries: Record<string, Record<string, Record<string, { hours: number; status: TimeSheetStatus }>>>;
  submittedWeeks: string[];
  weekStatuses: Record<string, TimeSheetStatus>;
  weekPercentage: number;
  selectedClients: string[];
  setSelectedClients: React.Dispatch<React.SetStateAction<string[]>>;
  selectedMediaTypes: string[];
  setSelectedMediaTypes: React.Dispatch<React.SetStateAction<string[]>>;
  handleReturnToFirstUnsubmittedWeek: () => void;
  handleNavigateToFirstUnderReviewWeek: () => void;
  handleTimeUpdate: (client: string, mediaType: string, hours: number) => void;
  handleSubmitForReview: () => void;
  handleApprove: () => void;
  handleReject: () => void;
  handleReturnToUnconfirmed: () => void;
  handleSaveVisibleClients: (clients: string[]) => void;
  handleSaveVisibleMediaTypes: (types: string[]) => void;
  getTotalHoursForWeek: () => number;
  hasUnsubmittedEarlierWeek: () => boolean;
  isCurrentWeekSubmitted: () => boolean;
  handleAddClient: (client: string) => void;
  handleAddMediaType: (type: string) => void;
  handleRemoveClient: (client: string) => void;
  handleRemoveMediaType: (type: string) => void;
  handleSelectClient: (client: string) => void;
  handleSelectMediaType: (type: string) => void;
  handleReorderClients: (newOrder: string[]) => void;
  handleReorderMediaTypes: (newOrder: string[]) => void;
  timeUpdateHandler: (client: string, mediaType: string, hours: number) => void;
  handleUserSelect: (user: User) => void;
  handleWeekHoursChange: (hours: number) => void;
  clientsWithEntries: string[];
  mediaTypesWithEntries: string[];
  getCurrentWeekStatus: (weekKey: string) => TimeSheetStatus;
  currentCustomWeek: any;
  handleProgressBarWeekSelect: (weekId: string) => void;
  filterYear: number | null;
  setFilterYear: React.Dispatch<React.SetStateAction<number | null>>;
}

export interface TimeSheetProviderProps {
  userRole: 'admin' | 'user' | 'manager';
  firstWeek: string;
  currentUser: User;
  users: User[];
  clients: Client[];
  readOnly?: boolean;
  impersonatedUser?: User;
  adminOverride?: boolean;
  customWeeks?: any[];
  initialWeekId?: string | null;
  isUserHead?: boolean;
  onTimeUpdate?: (weekId: string, client: string, mediaType: string, hours: number) => void;
  checkEarlierWeeksUnderReview?: (weekId: string) => boolean;
  children: React.ReactNode;
}
