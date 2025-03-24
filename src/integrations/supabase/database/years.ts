
import { supabase } from '../client';

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
  return await supabase
    .from('years')
    .select('*')
    .order('year', { ascending: false });
};

export const createYear = async (yearData: YearData) => {
  return await supabase
    .from('years')
    .insert(yearData)
    .select()
    .single();
};

export const updateYear = async (id: string, yearData: Partial<YearData>) => {
  return await supabase
    .from('years')
    .update(yearData)
    .eq('id', id)
    .select()
    .single();
};

export const deleteYear = async (id: string) => {
  return await supabase
    .from('years')
    .delete()
    .eq('id', id);
};
