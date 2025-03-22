
import { supabase } from '../client';

export const getUsers = async () => {
  try {
    return await supabase.from('users').select(`
      *,
      department:departments(name)
    `).eq('deletion_mark', false);
  } catch (error) {
    console.error('Error fetching users:', error);
    return { data: null, error };
  }
};

export const getUserById = async (id: string) => {
  return await supabase.from('users').select(`
    *,
    department:departments(name)
  `).eq('id', id).single();
};

export const createUser = async (user: any) => {
  return await supabase.from('users').insert(user).select().single();
};

export const updateUser = async (id: string, user: any) => {
  return await supabase.from('users').update(user).eq('id', id).select().single();
};

export const authenticateUser = async (login: string, password: string) => {
  try {
    return await supabase.from('users').select('*').eq('login', login).eq('password', password).single();
  } catch (error) {
    console.error('Authentication error:', error);
    return { data: null, error: { message: 'Authentication failed. Please check your connection to the server.' } };
  }
};

export const getUserSettings = async (userId: string) => {
  return await supabase
    .from('users')
    .select('dark_theme, language')
    .eq('id', userId)
    .single();
};

export const updateUserSettings = async (userId: string, settings: { dark_theme?: boolean, language?: string }) => {
  return await supabase
    .from('users')
    .update(settings)
    .eq('id', userId)
    .select('dark_theme, language')
    .single();
};

export const getUserFirstUnconfirmedWeek = async (userId: string) => {
  // Get week statuses that are either unconfirmed or needs-revision
  const { data: statusNames } = await supabase
    .from('week_status_names')
    .select('id')
    .or('name.eq.unconfirmed,name.eq.needs-revision');
  
  if (!statusNames || statusNames.length === 0) {
    return null;
  }
  
  const statusIds = statusNames.map(status => status.id);
  
  // Find the first week with these statuses
  const { data: weekStatuses, error } = await supabase
    .from('week_statuses')
    .select(`
      id,
      week_id,
      week_status_id,
      user_id,
      week:custom_weeks(id, name, period_from, period_to, required_hours)
    `)
    .eq('user_id', userId)
    .in('week_status_id', statusIds)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching week statuses:', error);
    return null;
  }
  
  if (weekStatuses && weekStatuses.length > 0 && weekStatuses[0].week) {
    return weekStatuses[0].week;
  }
  
  return null;
};
