
import { supabase } from '../client';

export const getCustomWeeks = async () => {
  try {
    return await supabase.from('custom_weeks').select('*').order('period_from', { ascending: true });
  } catch (error) {
    console.error('Error fetching custom weeks:', error);
    return { data: null, error };
  }
};

export const createCustomWeek = async (week: { name: string, period_from: string, period_to: string, required_hours: number }) => {
  return await supabase.from('custom_weeks').insert(week).select().single();
};
