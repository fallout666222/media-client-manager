
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
  description?: string;
}

export interface Client {
  id: string;
  name: string;
  parent_id?: string | null;
  hidden?: boolean;
  isDefault?: boolean;
  client_id?: string;
  ts_code?: string;
  description?: string;
  deletion_mark?: boolean;
  created_at?: string;
  // Frontend use only properties
  parentId?: string | null;
}

export interface Employee {
  id: string;
  name: string;
  department: string;
}

export interface User {
  id?: string;
  username?: string;
  password?: string;
  role?: 'admin' | 'user' | 'manager';
  firstWeek?: string;
  firstCustomWeekId?: string;
  managerId?: string;
  selectedClients?: string[];
  selectedMediaTypes?: string[];
  weekPercentages?: { weekId: string; percentage: number }[];
  departmentId?: string;
  hidden?: boolean;
  
  // Database fields
  name?: string;
  type?: string;
  email?: string;
  job_position?: string;
  first_week?: string;
  first_custom_week_id?: string;
  description?: string;
  login?: string;
  department_id?: string;
  manager_id?: string;
  deletion_mark?: boolean;
  
  // Added field for department name
  departmentName?: string | null;

  // User Head related fields
  user_head_id?: string;
}

export interface UserFormData {
  username: string;
  password: string;
  role: 'admin' | 'user' | 'manager';
  name?: string;
  login?: string;
  type?: string;
}

export interface WeekPercentage {
  userId: string;
  weekId: string;
  percentage: number;
}

export interface CustomWeek {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  hours?: number;
  period_from?: string;
  period_to?: string;
  required_hours?: number;
  created_at?: string;
}
