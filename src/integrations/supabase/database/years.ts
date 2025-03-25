
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
  const result = await db.from('years');
  return result
    .select('*')
    .order('year', { ascending: false });
};

export const getYearByName = async (yearName: string) => {
  const result = await db.from('years');
  return result
    .select('*')
    .eq('year', yearName)
    .single();
};

export const createYear = async (yearData: YearData) => {
  const result = await db.from('years');
  return result
    .insert(yearData)
    .select()
    .single();
};

export const updateYear = async (id: string, yearData: Partial<YearData>) => {
  const result = await db.from('years');
  return result
    .update(yearData)
    .eq('id', id)
    .select()
    .single();
};

export const deleteYear = async (id: string) => {
  const result = await db.from('years');
  return result
    .delete()
    .eq('id', id);
};
