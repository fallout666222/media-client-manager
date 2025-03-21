
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
    console.log(`Authenticating user: ${login}`);
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
    console.log('No unconfirmed or needs-revision status names found');
    return null;
  }
  
  const statusIds = statusNames.map(status => status.id);
  console.log('Status IDs to search for:', statusIds);
  
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
  
  console.log('Found week statuses:', weekStatuses);
  
  if (weekStatuses && weekStatuses.length > 0 && weekStatuses[0].week) {
    return weekStatuses[0].week;
  }
  
  console.log('No weeks with unconfirmed/needs-revision status found for user:', userId);
  return null;
};

// User Manager relations
export const getUserManagers = async () => {
  return await supabase.from('user_managers').select(`
    *,
    user:users!user_id(id, name),
    manager:users!manager_id(id, name)
  `);
};

export const assignManagerToUser = async (userId: string, managerId: string) => {
  return await supabase.from('user_managers').insert({ user_id: userId, manager_id: managerId }).select().single();
};
