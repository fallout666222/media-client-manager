
import { supabase } from '../client';

export const getDepartments = async () => {
  return await supabase.from('departments').select('*');
};

export const createDepartment = async (department: { name: string, description?: string }) => {
  return await supabase.from('departments').insert(department).select().single();
};

export const deleteDepartment = async (id: string) => {
  return await supabase.from('departments').delete().eq('id', id);
};
