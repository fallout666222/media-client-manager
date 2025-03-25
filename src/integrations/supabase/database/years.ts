
import { db } from '../client';

export interface YearData {
  id?: string;
  year: string;
  jan: number;
  feb: number;
  mar: number;
  apr: number;
  may: number;
  jun: number;
  jul: number;
  aug: number;
  sep: number;
  oct: number;
  nov: number;
  dec: number;
}

export const getAllYears = async () => {
  return await db
    .from('years')
    .select('*')
    .order('year', { ascending: false });
};

export const getYearByName = async (yearName: string) => {
  return await db
    .from('years')
    .select('*')
    .eq('year', yearName)
    .single();
};

export const createYear = async (yearData: YearData) => {
  return await db
    .from('years')
    .insert(yearData)
    .select()
    .single();
};

export const updateYear = async (id: string, yearData: Partial<YearData>) => {
  return await db
    .from('years')
    .update(yearData)
    .eq('id', id)
    .select()
    .single();
};

export const deleteYear = async (id: string) => {
  return await db
    .from('years')
    .delete()
    .eq('id', id);
};
