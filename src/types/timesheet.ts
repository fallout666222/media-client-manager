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
