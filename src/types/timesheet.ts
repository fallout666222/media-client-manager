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

export interface Employee {
  id: string;
  name: string;
  department: string;
}

export interface Department {
  id: string;
  name: string;
}