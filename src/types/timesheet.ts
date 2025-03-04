

export type TimeSheetStatus = 'unconfirmed' | 'under-review' | 'accepted' | 'needs-revision';

export interface TimeEntry {
  hours: number;
  status: TimeSheetStatus;
}

export interface TimeSheetData {
  [client: string]: {
    [mediaType: string]: TimeEntry;
  };
}

export interface Department {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  name: string;
  department: string;
}

export interface User {
  id?: string;         
  username: string;
  password: string;
  role: 'admin' | 'user' | 'manager';
  firstWeek?: string;
  managerId?: string;
  departmentId?: string;
  selectedClients?: string[];
  selectedMediaTypes?: string[];
  weekPercentages?: { weekId: string; percentage: number }[];
  hideFromManager?: boolean;
}

export interface UserFormData {
  username: string;
  password: string;
  role: 'admin' | 'user' | 'manager';
}

export interface WeekPercentage {
  userId: string;
  weekId: string;
  percentage: number;
}

