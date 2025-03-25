
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
  const query = db.from('years')
    .select('*')
    .order('year', { ascending: false });
  
  return await query;
};

export const getYearByName = async (yearName: string) => {
  const query = db.from('years')
    .select('*')
    .eq('year', yearName)
    .single();
  
  return await query;
};

export const createYear = async (yearData: YearData) => {
  const query = db.from('years')
    .insert(yearData)
    .select()
    .single();
  
  return await query;
};

export const updateYear = async (id: string, yearData: Partial<YearData>) => {
  const query = db.from('years')
    .update(yearData)
    .eq('id', id)
    .select()
    .single();
  
  return await query;
};

export const deleteYear = async (id: string) => {
  const query = db.from('years')
    .delete()
    .eq('id', id);
  
  return await query;
};
