
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

// Week Status Names
export const getWeekStatusNames = async () => {
  return await supabase.from('week_status_names').select('*');
};

// Week Statuses
export const getWeekStatuses = async (userId: string) => {
  return await supabase.from('week_statuses').select(`
    *,
    week:custom_weeks(*),
    status:week_status_names(*)
  `).eq('user_id', userId);
};

export const getWeekStatusesChronological = async (userId: string) => {
  const { data, error } = await supabase.from('week_statuses').select(`
    *,
    week:custom_weeks(*),
    status:week_status_names(*)
  `).eq('user_id', userId);
  
  if (error) throw error;
  
  // Sort by week's period_from date if data exists
  return {
    data: data?.sort((a, b) => {
      if (!a.week || !b.week) return 0;
      
      const dateA = new Date(a.week.period_from);
      const dateB = new Date(b.week.period_from);
      return dateA.getTime() - dateB.getTime();
    }),
    error
  };
};

export const updateWeekStatus = async (userId: string, weekId: string, statusId: string) => {
  // Check if status already exists
  const { data } = await supabase.from('week_statuses')
    .select('*')
    .eq('user_id', userId)
    .eq('week_id', weekId)
    .maybeSingle();
  
  if (data) {
    return await supabase.from('week_statuses')
      .update({ week_status_id: statusId })
      .eq('id', data.id)
      .select()
      .single();
  } else {
    return await supabase.from('week_statuses')
      .insert({ user_id: userId, week_id: weekId, week_status_id: statusId })
      .select()
      .single();
  }
};

// Week Percentages
export const getWeekPercentages = async (userId: string) => {
  return await supabase.from('week_percentages').select(`
    *,
    week:custom_weeks(*)
  `).eq('user_id', userId);
};

export const updateWeekPercentage = async (userId: string, weekId: string, percentage: number) => {
  // Check if percentage already exists
  const { data } = await supabase.from('week_percentages')
    .select('*')
    .eq('user_id', userId)
    .eq('week_id', weekId)
    .maybeSingle();
  
  if (data) {
    return await supabase.from('week_percentages')
      .update({ percentage })
      .eq('id', data.id)
      .select()
      .single();
  } else {
    return await supabase.from('week_percentages')
      .insert({ user_id: userId, week_id: weekId, percentage })
      .select()
      .single();
  }
};
