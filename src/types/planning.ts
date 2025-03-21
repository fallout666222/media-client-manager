
import { Client } from './timesheet';

export interface PlanningVersion {
  id: string;
  name: string;
  year: string;
  q1_locked: boolean;
  q2_locked: boolean;
  q3_locked: boolean;
  q4_locked: boolean;
  created_at?: string;
}

export interface PlanningHours {
  id: string;
  version_id: string;
  user_id: string;
  client_id: string;
  month: string;
  hours: number;
  created_at?: string;
  client?: Client;
}

export interface MonthData {
  Jan: number;
  Feb: number;
  Mar: number;
  Q1: number;
  Apr: number;
  May: number;
  Jun: number;
  Q2: number;
  Jul: number;
  Aug: number;
  Sep: number;
  Q3: number;
  Oct: number;
  Nov: number;
  Dec: number;
  Q4: number;
  FY: number;
}

export interface ClientHours {
  client: Client;
  months: MonthData;
}
