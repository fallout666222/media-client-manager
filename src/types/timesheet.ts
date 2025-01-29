export interface User {
  username: string;
  password: string;
  role: string;
  firstWeek?: string;
}

export interface UserFormData {
  username: string;
  password: string;
  role: string;
  firstWeek?: string;
}

export interface CustomWeek {
  id: string;
  startDate: string;
  endDate: string;
  hours: number;
}

export type TimeSheetStatus = 'draft' | 'pending' | 'under-review' | 'needs-revision' | 'accepted' | 'rejected';

export interface TimeEntry {
  hours: number;
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