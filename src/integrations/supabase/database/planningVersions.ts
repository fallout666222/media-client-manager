
import { supabase } from '../client';

export const getAllPlanningVersions = async () => {
  return await supabase.from('planning_versions')
    .select('*')
    .order('created_at', { ascending: false });
};

export const createPlanningVersion = async (
  name: string,
  year: string,
  q1_locked: boolean = false,
  q2_locked: boolean = false,
  q3_locked: boolean = false,
  q4_locked: boolean = false
) => {
  return await supabase.from('planning_versions')
    .insert({
      name,
      year,
      q1_locked,
      q2_locked,
      q3_locked,
      q4_locked
    })
    .select()
    .single();
};

export const updatePlanningVersion = async (
  id: string,
  updates: {
    name?: string;
    year?: string;
    q1_locked?: boolean;
    q2_locked?: boolean;
    q3_locked?: boolean;
    q4_locked?: boolean;
  }
) => {
  return await supabase.from('planning_versions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
};

export const deletePlanningVersion = async (id: string) => {
  return await supabase.from('planning_versions')
    .delete()
    .eq('id', id);
};
