
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
  username: string;
  password: string;
  role: 'admin' | 'user' | 'manager';
  firstWeek?: string;
  managerId?: string;
  selectedClients?: string[];
  selectedMediaTypes?: string[];
}

export interface UserFormData {
  username: string;
  password: string;
  role: 'admin' | 'user' | 'manager';
}
