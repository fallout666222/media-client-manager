import { supabase } from './client';

// Custom Weeks
export const getCustomWeeks = async () => {
  return await supabase.from('custom_weeks').select('*').order('period_from', { ascending: true });
};

export const createCustomWeek = async (week: { name: string, period_from: string, period_to: string, required_hours: number }) => {
  return await supabase.from('custom_weeks').insert(week).select().single();
};

// Users
export const getUsers = async () => {
  const { data: users, error } = await supabase.from('users')
    .select(`
      *,
      department:departments(name)
    `)
    .eq('deletion_mark', false);
  
  if (error) throw error;
  
  if (users && users.length > 0) {
    for (const user of users) {
      if (user.manager_id) {
        const { data: manager, error: managerError } = await supabase
          .from('users')
          .select('id, name, login, type')
          .eq('id', user.manager_id)
          .single();
        
        if (!managerError && manager) {
          user.manager = manager;
        }
      }
    }
  }
  
  return { data: users, error: null };
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
  return await supabase.from('users').select('*').eq('login', login).eq('password', password).single();
};

// Get all users with manager role
export const getManagers = async () => {
  return await supabase.from('users').select('*')
    .eq('deletion_mark', false)
    .eq('type', 'manager');
};

// Media Types
export const getMediaTypes = async () => {
  return await supabase.from('media_types').select('*');
};

// Departments
export const getDepartments = async () => {
  return await supabase.from('departments').select('*');
};

export const createDepartment = async (department: { name: string, description?: string }) => {
  return await supabase.from('departments').insert(department).select().single();
};

export const deleteDepartment = async (id: string) => {
  return await supabase.from('departments').delete().eq('id', id);
};

// Clients
export const getClients = async () => {
  return await supabase.from('clients').select('*').eq('deletion_mark', false);
};

export const createClient = async (client: { name: string, client_id?: string, ts_code?: string, description?: string }) => {
  return await supabase.from('clients').insert(client).select().single();
};

export const updateClient = async (id: string, client: any) => {
  return await supabase.from('clients').update(client).eq('id', id).select().single();
};

export const deleteClient = async (id: string) => {
  return await supabase.from('clients').update({ deletion_mark: true }).eq('id', id);
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

// Week Statuses
export const getWeekStatuses = async (userId: string) => {
  return await supabase.from('week_statuses').select(`
    *,
    week:custom_weeks(*),
    status:week_status_names(*)
  `).eq('user_id', userId);
};

export const updateWeekStatus = async (userId: string, weekId: string, statusId: string) => {
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

// Week Hours
export const getWeekHours = async (userId: string, weekId: string) => {
  return await supabase.from('week_hours').select(`
    *,
    client:clients(*),
    media_type:media_types(*)
  `).eq('user_id', userId).eq('week_id', weekId);
};

export const updateWeekHours = async (
  userId: string, 
  weekId: string, 
  clientId: string, 
  mediaTypeId: string, 
  hours: number
) => {
  const { data } = await supabase.from('week_hours')
    .select('*')
    .eq('user_id', userId)
    .eq('week_id', weekId)
    .eq('client_id', clientId)
    .eq('media_type_id', mediaTypeId)
    .maybeSingle();
  
  if (data) {
    return await supabase.from('week_hours')
      .update({ hours })
      .eq('id', data.id)
      .select()
      .single();
  } else {
    return await supabase.from('week_hours')
      .insert({ user_id: userId, week_id: weekId, client_id: clientId, media_type_id: mediaTypeId, hours })
      .select()
      .single();
  }
};

// Visible Clients & Types
export const getUserVisibleClients = async (userId: string) => {
  return await supabase.from('visible_clients').select(`
    *,
    client:clients(*)
  `).eq('user_id', userId);
};

export const addUserVisibleClient = async (userId: string, clientId: string) => {
  return await supabase.from('visible_clients').insert({ user_id: userId, client_id: clientId }).select().single();
};

export const removeUserVisibleClient = async (id: string) => {
  return await supabase.from('visible_clients').delete().eq('id', id);
};

export const getUserVisibleTypes = async (userId: string) => {
  return await supabase.from('visible_types').select(`
    *,
    type:media_types(*)
  `).eq('user_id', userId);
};

export const addUserVisibleType = async (userId: string, typeId: string) => {
  return await supabase.from('visible_types').insert({ user_id: userId, type_id: typeId }).select().single();
};

export const removeUserVisibleType = async (id: string) => {
  return await supabase.from('visible_types').delete().eq('id', id);
};

// Status Names
export const getWeekStatusNames = async () => {
  return await supabase.from('week_status_names').select('*');
};
