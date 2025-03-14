
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Client } from '@/types/timesheet';
import * as db from '@/integrations/supabase/database';
import { useToast } from '@/hooks/use-toast';

interface AppContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  users: User[];
  departments: any[];
  clients: Client[];
  customWeeks: any[];
  handleLogin: (userData: any) => Promise<void>;
  handleLogout: () => void;
  handleSetFirstWeek: (username: string, date: string, weekId?: string) => void;
  handleUpdateUserManager: (username: string, managerId: string | undefined) => void;
  handleUpdateUserDepartment: (username: string, departmentId: string | undefined) => void;
  handleToggleUserHidden: (username: string, hidden: boolean) => void;
  handleAddClient: (clientData: Omit<Client, "id">) => void;
  handleUpdateClient: (id: string, clientData: Partial<Client>) => void;
  handleDeleteClient: (id: string) => void;
  handleAddDepartment: (departmentData: any) => void;
  handleDeleteDepartment: (id: string) => void;
  getVisibleUsers: () => User[];
  getVisibleClients: () => string[];
  isUserHead: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [customWeeks, setCustomWeeks] = useState<any[]>([]);
  
  const { toast } = useToast();

  // Load user session from localStorage
  useEffect(() => {
    const loadUserSession = () => {
      try {
        const storedUser = localStorage.getItem('userSession');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          console.log('Retrieved user session from localStorage:', userData);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading user session:', error);
        localStorage.removeItem('userSession');
      } finally {
        if (!localStorage.getItem('userSession')) {
          setLoading(false);
        }
      }
    };
    
    loadUserSession();
  }, []);

  // Fetch initial data when user is set
  useEffect(() => {
    if (user) {
      fetchInitialData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      const { data: usersData, error: usersError } = await db.getUsers();
      if (usersError) throw usersError;
      setUsers(usersData || []);
      
      const { data: departmentsData, error: departmentsError } = await db.getDepartments();
      if (departmentsError) throw departmentsError;
      setDepartments(departmentsData || []);
      
      const { data: clientsData, error: clientsError } = await db.getClients();
      if (clientsError) throw clientsError;
      setClients(clientsData || []);
      
      const { data: weeksData, error: weeksError } = await db.getCustomWeeks();
      if (weeksError) throw weeksError;
      setCustomWeeks(weeksData || []);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast({
        title: "Error",
        description: "Failed to load initial data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (userData: any) => {
    try {
      console.log('Login received user data:', userData);
      const { data, error } = await db.getUserById(userData.id || '');
      
      if (error) {
        console.error('Error getting user details:', error);
        throw error;
      }
      
      if (data) {
        console.log('Setting user state with data:', data);
        const fullUserData: User = {
          ...userData,
          id: data.id,
          name: data.name,
          role: data.type as 'admin' | 'user' | 'manager',
          type: data.type,
          username: data.login,
          login: data.login,
          password: data.password,
          email: data.email,
          job_position: data.job_position,
          description: data.description,
          department_id: data.department_id,
          departmentId: data.department_id,
          first_week: data.first_week,
          firstWeek: data.first_week,
          first_custom_week_id: data.first_custom_week_id,
          firstCustomWeekId: data.first_custom_week_id,
          deletion_mark: data.deletion_mark,
          dark_theme: data.dark_theme,
          language: data.language
        };
        
        setUser(fullUserData);
        localStorage.setItem('userSession', JSON.stringify(fullUserData));
      }
    } catch (error) {
      console.error('Error getting user details:', error);
      toast({
        title: "Error",
        description: "Failed to get user details",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('userSession');
    localStorage.removeItem('redirectToWeek');
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out"
    });
  };

  const handleSetFirstWeek = (username: string, date: string, weekId?: string) => {
    setUsers(prevUsers => prevUsers.map(u => 
      u.username === username 
        ? {
            ...u,
            firstWeek: date,
            firstCustomWeekId: weekId || u.firstCustomWeekId
          } 
        : u
    ));
    
    if (user && user.username === username) {
      setUser(prevUser => 
        prevUser 
          ? {
              ...prevUser,
              firstWeek: date,
              firstCustomWeekId: weekId || prevUser.firstCustomWeekId
            } 
          : null
      );
    }
    
    toast({
      title: "First Week Set",
      description: `First week set for ${username}: ${date}`
    });
  };

  const handleUpdateUserManager = (username: string, managerId: string | undefined) => {
    setUsers(prevUsers => prevUsers.map(u => 
      u.username === username ? { ...u, managerId } : u
    ));
    
    if (user && user.username === username) {
      setUser(prevUser => prevUser ? { ...prevUser, managerId } : null);
    }
  };

  const handleUpdateUserDepartment = (username: string, departmentId: string | undefined) => {
    setUsers(prevUsers => prevUsers.map(u => 
      u.username === username ? { ...u, departmentId } : u
    ));
    
    if (user && user.username === username) {
      setUser(prevUser => prevUser ? { ...prevUser, departmentId } : null);
    }
  };

  const handleToggleUserHidden = (username: string, hidden: boolean) => {
    setUsers(prevUsers => prevUsers.map(u => 
      u.username === username ? { ...u, hidden } : u
    ));
    
    if (user && user.username === username) {
      setUser(prevUser => prevUser ? { ...prevUser, hidden } : null);
    }
  };

  const handleAddClient = (clientData: Omit<Client, "id">) => {
    const newId = `${clients.length + 1}`;
    const newClient: Client = {
      id: newId,
      ...clientData
    };
    
    setClients(prevClients => [...prevClients, newClient]);
  };

  const handleUpdateClient = (id: string, clientData: Partial<Client>) => {
    setClients(prevClients => prevClients.map(client => 
      client.id === id ? { ...client, ...clientData } : client
    ));
  };

  const handleDeleteClient = (id: string) => {
    const clientToDelete = clients.find(client => client.id === id);
    
    if (clientToDelete?.isDefault) {
      toast({
        title: "Cannot Delete",
        description: "Default clients cannot be deleted",
        variant: "destructive"
      });
      return;
    }
    
    const hasChildren = clients.some(client => client.parentId === id);
    
    if (hasChildren) {
      toast({
        title: "Cannot Delete",
        description: "This client has child clients. Please reassign or delete them first.",
        variant: "destructive"
      });
      return;
    }
    
    setUsers(prevUsers => prevUsers.map(user => {
      if (user.selectedClients && user.selectedClients.includes(id)) {
        return {
          ...user,
          selectedClients: user.selectedClients.filter(clientId => clientId !== id)
        };
      }
      return user;
    }));
    
    setClients(prevClients => prevClients.filter(client => client.id !== id));
  };

  const handleAddDepartment = (departmentData: any) => {
    const newId = `${departments.length + 1}`;
    const newDepartment = {
      id: newId,
      ...departmentData
    };
    
    setDepartments(prevDepartments => [...prevDepartments, newDepartment]);
  };

  const handleDeleteDepartment = (id: string) => {
    const usersInDepartment = users.filter(u => u.departmentId === id);
    
    if (usersInDepartment.length > 0) {
      toast({
        title: "Cannot Delete",
        description: "There are users assigned to this department",
        variant: "destructive"
      });
      return;
    }
    
    setDepartments(prevDepartments => prevDepartments.filter(dept => dept.id !== id));
    
    toast({
      title: "Department Deleted",
      description: "Department has been removed"
    });
  };

  const getVisibleUsers = () => {
    return users.filter(u => !u.hidden);
  };

  const getVisibleClients = () => {
    return clients.filter(c => !c.hidden).map(c => c.name);
  };

  const isUserHead = user && users.some(u => u.user_head_id === user.id) || false;

  const value = {
    user,
    setUser,
    loading,
    users,
    departments,
    clients,
    customWeeks,
    handleLogin,
    handleLogout,
    handleSetFirstWeek,
    handleUpdateUserManager,
    handleUpdateUserDepartment,
    handleToggleUserHidden,
    handleAddClient,
    handleUpdateClient,
    handleDeleteClient,
    handleAddDepartment,
    handleDeleteDepartment,
    getVisibleUsers,
    getVisibleClients,
    isUserHead,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
