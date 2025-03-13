import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import TimeSheet from "./pages/TimeSheet";
import { Login } from "./components/Auth/Login";
import DepartmentManagement from "./components/Admin/DepartmentManagement";
import UserImpersonation from "./pages/UserImpersonation";
import CustomWeeks from "./pages/CustomWeeks";
import UserManagerAssignment from "./pages/UserManagerAssignment";
import UserFirstWeekManagement from "./pages/UserFirstWeekManagement";
import UserWeekPercentage from "./pages/UserWeekPercentage";
import ManagerView from "./pages/ManagerView";
import ClientTree from "./pages/ClientTree";
import MediaTypeManagement from "./pages/MediaTypeManagement";
import { useState, useEffect } from "react";
import { User, Client } from "./types/timesheet";
import { Button } from "./components/ui/button";
import { LogOut, Users, Calendar, UserCog, CalendarDays, Percent, Eye, Building, ArrowLeft, TreeDeciduous, Film } from "lucide-react";
import { useToast } from "./hooks/use-toast";
import * as db from "./integrations/supabase/database";
import UserHeadView from "./pages/UserHeadView";
import { UserCircle } from "lucide-react";
import { AdfsCallback } from "./pages/AuthCallbacks";
import { StatusTimeline, WeekDetails, WeekData } from "./components/ProgressBar";

const queryClient = new QueryClient();

function NavButton({
  to,
  children
}: {
  to: string;
  children: React.ReactNode;
}) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return <Link to={to}>
      <Button variant={isActive ? "active" : "outline"} size="sm" className="flex items-center gap-2">
        {children}
      </Button>
    </Link>;
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [customWeeks, setCustomWeeks] = useState<any[]>([]);
  const {
    toast
  } = useToast();

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

  useEffect(() => {
    if (user) {
      fetchInitialData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleLogin = async (userData: any) => {
    try {
      console.log('Login received user data:', userData);
      const {
        data,
        error
      } = await db.getUserById(userData.id || '');
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
          deletion_mark: data.deletion_mark
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

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const {
        data: usersData,
        error: usersError
      } = await db.getUsers();
      if (usersError) throw usersError;
      setUsers(usersData || []);
      const {
        data: departmentsData,
        error: departmentsError
      } = await db.getDepartments();
      if (departmentsError) throw departmentsError;
      setDepartments(departmentsData || []);
      const {
        data: clientsData,
        error: clientsError
      } = await db.getClients();
      if (clientsError) throw clientsError;
      setClients(clientsData || []);
      const {
        data: weeksData,
        error: weeksError
      } = await db.getCustomWeeks();
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

  const handleCreateUser = async (userData: any) => {
    try {
      toast({
        title: "User Creation Moved",
        description: "Please use the User Management page to create users",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive"
      });
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
    setUsers(prevUsers => prevUsers.map(u => u.username === username ? {
      ...u,
      firstWeek: date,
      firstCustomWeekId: weekId || u.firstCustomWeekId
    } : u));
    if (user && user.username === username) {
      setUser(prevUser => prevUser ? {
        ...prevUser,
        firstWeek: date,
        firstCustomWeekId: weekId || prevUser.firstCustomWeekId
      } : null);
    }
    toast({
      title: "First Week Set",
      description: `First week set for ${username}: ${date}`
    });
  };

  const handleUpdateUserManager = (username: string, managerId: string | undefined) => {
    setUsers(prevUsers => prevUsers.map(u => u.username === username ? {
      ...u,
      managerId
    } : u));
    if (user && user.username === username) {
      setUser(prevUser => prevUser ? {
        ...prevUser,
        managerId
      } : null);
    }
  };

  const handleUpdateUserDepartment = (username: string, departmentId: string | undefined) => {
    setUsers(prevUsers => prevUsers.map(u => u.username === username ? {
      ...u,
      departmentId
    } : u));
    if (user && user.username === username) {
      setUser(prevUser => prevUser ? {
        ...prevUser,
        departmentId
      } : null);
    }
  };

  const handleToggleUserHidden = (username: string, hidden: boolean) => {
    setUsers(prevUsers => prevUsers.map(u => u.username === username ? {
      ...u,
      hidden
    } : u));
    if (user && user.username === username) {
      setUser(prevUser => prevUser ? {
        ...prevUser,
        hidden
      } : null);
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
    setClients(prevClients => prevClients.map(client => client.id === id ? {
      ...client,
      ...clientData
    } : client));
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

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return <>
      {user && <div className="fixed top-4 right-4 z-50 flex items-center gap-2 flex-wrap justify-end">
          <span className="text-sm text-gray-600">
            Logged in as: {user.username} ({user.role})
          </span>
          {user.role === 'admin' && <>
              <NavButton to="/view-users">
                <Users className="h-4 w-4" />
                View Users
              </NavButton>
              <NavButton to="/custom-weeks">
                <Calendar className="h-4 w-4" />
                Custom Weeks
              </NavButton>
              <NavButton to="/user-manager">
                <UserCog className="h-4 w-4" />
                User-Manager
              </NavButton>
              <NavButton to="/first-weeks">
                <CalendarDays className="h-4 w-4" />
                First Weeks
              </NavButton>
              <NavButton to="/week-percentage">
                <Percent className="h-4 w-4" />
                Week Percentage
              </NavButton>
              <NavButton to="/departments">
                <Building className="h-4 w-4" />
                Departments
              </NavButton>
              <NavButton to="/client-tree">
                <TreeDeciduous className="h-4 w-4" />
                Client Tree
              </NavButton>
              <NavButton to="/media-types">
                <Film className="h-4 w-4" />
                Media Types
              </NavButton>
            </>}
          {user.role === 'manager' && <NavButton to="/manager-view">
              <Eye className="h-4 w-4" />
              View Team
            </NavButton>}
          {isUserHead && <NavButton to="/user-head-view">
              <UserCircle className="h-4 w-4" />
              User Head View
            </NavButton>}
          <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>}
      <Routes>
        <Route path="/" element={user ? <div className="container mx-auto p-4 pt-16">
                {user.role === 'admin' || user.firstWeek || user.firstCustomWeekId ? <>
                    {customWeeks.length > 0 && <div className="mb-8">
                        <UserProgressBar userId={user.id} customWeeks={customWeeks} />
                      </div>}
                    <TimeSheet userRole={user.role} firstWeek={user.firstWeek || (user.role === 'admin' ? '2024-01-01' : '')} currentUser={user} users={users} clients={clients} />
                  </> : <div className="text-center p-8">
                    <h2 className="text-xl font-semibold mb-4">
                      Welcome! Please wait for an admin to set your first working week.
                    </h2>
                  </div>}
              </div> : <Navigate to="/login" replace />} />
        <Route path="/login" element={!user ? <Login onLogin={handleLogin} users={users} /> : <Navigate to="/" replace />} />
        <Route path="/auth/adfs-callback" element={<AdfsCallback />} />
        <Route path="/view-users" element={user?.role === 'admin' ? <UserImpersonation clients={clients} /> : <Navigate to="/" replace />} />
        <Route path="/custom-weeks" element={user?.role === 'admin' ? <CustomWeeks /> : <Navigate to="/" replace />} />
        <Route path="/user-manager" element={user?.role === 'admin' ? <UserManagerAssignment onUpdateUserManager={handleUpdateUserManager} onUpdateUserDepartment={handleUpdateUserDepartment} onToggleUserHidden={handleToggleUserHidden} /> : <Navigate to="/" replace />} />
        <Route path="/first-weeks" element={user?.role === 'admin' ? <UserFirstWeekManagement /> : <Navigate to="/" replace />} />
        <Route path="/week-percentage" element={user?.role === 'admin' ? <UserWeekPercentage /> : <Navigate to="/" replace />} />
        <Route path="/manager-view" element={user?.role === 'manager' ? <ManagerView currentUser={user} users={getVisibleUsers()} clients={clients} /> : <Navigate to="/" replace />} />
        <Route path="/client-tree" element={user?.role === 'admin' ? <ClientTree /> : <Navigate to="/" replace />} />
        <Route path="/departments" element={user?.role === 'admin' ? <div className="container mx-auto p-4 pt-16">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold">Department Management</h1>
                  <Link to="/">
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Back to Dashboard
                    </Button>
                  </Link>
                </div>
                <DepartmentManagement departments={departments} onAddDepartment={handleAddDepartment} onDeleteDepartment={handleDeleteDepartment} />
              </div> : <Navigate to="/" replace />} />
        <Route path="/media-types" element={user?.role === 'admin' ? <MediaTypeManagement /> : <Navigate to="/" replace />} />
        <Route path="/user-head-view" element={user && isUserHead ? <UserHeadView currentUser={user} clients={clients} /> : <Navigate to="/" replace />} />
      </Routes>
    </>;
}

function UserProgressBar({
  userId,
  customWeeks
}: {
  userId: string;
  customWeeks: any[];
}) {
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<number | null>(null);

  useEffect(() => {
    const fetchWeekStatuses = async () => {
      if (!userId || customWeeks.length === 0) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const allAvailableWeeks = [...customWeeks];
        const {
          data: weekStatuses
        } = await db.getWeekStatusesChronological(userId);
        let formattedWeeks = [];
        if (weekStatuses && weekStatuses.length > 0) {
          const existingStatusMap = new Map();
          weekStatuses.forEach(statusData => {
            if (statusData.week) {
              existingStatusMap.set(statusData.week.id, {
                week: statusData.week.name,
                status: (statusData.status?.name || 'unconfirmed') as 'accepted' | 'under revision' | 'under review' | 'Unconfirmed',
                weekId: statusData.week.id,
                periodFrom: statusData.week.period_from
              });
            }
          });
          formattedWeeks = allAvailableWeeks.map(week => {
            const existingStatus = existingStatusMap.get(week.id);
            return existingStatus || {
              week: week.name,
              status: 'Unconfirmed' as 'accepted' | 'under revision' | 'under review' | 'Unconfirmed',
              weekId: week.id,
              periodFrom: week.period_from
            };
          });
          formattedWeeks.sort((a, b) => {
            const weekA = allAvailableWeeks.find(w => w.name === a.week);
            const weekB = allAvailableWeeks.find(w => w.name === b.week);
            if (!weekA || !weekB) return 0;
            return new Date(weekA.period_from).getTime() - new Date(weekB.period_from).getTime();
          });
        } else {
          formattedWeeks = allAvailableWeeks.map(week => ({
            week: week.name,
            status: 'Unconfirmed' as 'accepted' | 'under revision' | 'under review' | 'Unconfirmed',
            weekId: week.id,
            periodFrom: week.period_from
          }));
          formattedWeeks.sort((a, b) => {
            const weekA = allAvailableWeeks.find(w => w.name === a.week);
            const weekB = allAvailableWeeks.find(w => w.name === b.week);
            if (!weekA || !weekB) return 0;
            return new Date(weekA.period_from).getTime() - new Date(weekB.period_from).getTime();
          });
        }
        setWeeks(formattedWeeks);
        setSelectedWeek(formattedWeeks[0] || null);
      } catch (error) {
        console.error('Error fetching week statuses:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWeekStatuses();
  }, [userId, customWeeks]);

  const handleSelectWeek = (weekData: WeekData) => {
    setSelectedWeek(weekData);
    
    if (weekData.weekId) {
      localStorage.setItem(`selectedWeek_${userId}`, weekData.weekId);
      console.log(`ProgressBar: Selected week ${weekData.week} (ID: ${weekData.weekId})`);
      
      window.dispatchEvent(new CustomEvent('progressbar-week-selected', { 
        detail: { weekId: weekData.weekId } 
      }));
    }
  };

  const handleProgressBarWeekSelect = (weekId: string) => {
    const weekToSelect = weeks.find(week => week.weekId === weekId);
    if (weekToSelect) {
      setSelectedWeek(weekToSelect);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-12">Loading progress...</div>;
  }
  if (weeks.length === 0) {
    return null;
  }
  return <div className="w-full max-w-3xl mx-auto">
      <StatusTimeline 
        weeks={weeks} 
        selectedWeek={selectedWeek} 
        onSelectWeek={handleSelectWeek} 
        filterYear={filterYear}
      />
      <WeekDetails weekData={selectedWeek} />
    </div>;
}

export function App() {
  return <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>;
}

export default App;
