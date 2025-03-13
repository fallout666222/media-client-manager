
import { User, Department } from '@/types/timesheet';
import { getUsers, getDepartments, updateUser } from '@/integrations/supabase/database';

export const fetchUsers = async () => {
  try {
    const { data, error } = await getUsers();
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const fetchDepartments = async () => {
  try {
    const { data, error } = await getDepartments();
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }
};

export const updateUserManager = async (userId: string, managerId: string | undefined) => {
  try {
    await updateUser(userId, { manager_id: managerId });
    return true;
  } catch (error) {
    console.error('Error updating user manager:', error);
    throw error;
  }
};

export const updateUserDepartment = async (userId: string, departmentId: string | undefined) => {
  try {
    const updatedValue = departmentId === undefined || departmentId === "none" ? null : departmentId;
    await updateUser(userId, { department_id: updatedValue });
    return true;
  } catch (error) {
    console.error('Error updating user department:', error);
    throw error;
  }
};

export const updateUserHead = async (userId: string, userHeadId: string | undefined) => {
  try {
    const updatedValue = userHeadId === undefined || userHeadId === "none" ? null : userHeadId;
    await updateUser(userId, { user_head_id: updatedValue });
    return true;
  } catch (error) {
    console.error('Error updating user head:', error);
    throw error;
  }
};

export const updateUserVisibility = async (userId: string, hidden: boolean) => {
  try {
    await updateUser(userId, { hidden });
    return true;
  } catch (error) {
    console.error('Error updating user visibility:', error);
    throw error;
  }
};
