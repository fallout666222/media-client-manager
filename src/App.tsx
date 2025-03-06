import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
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
import { 
  LogOut, 
  Users, 
  Calendar, 
  UserCog, 
  CalendarDays, 
  Percent, 
  Eye, 
  Building, 
  ArrowLeft, 
  TreeDeciduous,
  Film
} from "lucide-react";
import { useToast } from "./hooks/use-toast";
import * as db from "./integrations/supabase/database";
import UserHeadView from "./pages/UserHeadView";
import { UserCircle } from "lucide-react";

const queryClient = new QueryClient();

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const { toast } = useToast();

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
          deletion_mark: data.deletion_mark
        };
        
        setUser(fullUserData);
      }
    } catch (error) {
      console.error('Error getting user details:', error);
      toast({
        title: "Error",
        description: "Failed to get user details",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

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
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast({
        title: "Error",
        description: "Failed to load initial data",
        variant: "destructive",
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
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    setUser(null);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  const handleSetFirstWeek = (username: string, date: string, weekId?: string) => {
    setUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.username === username ? { 
          ...u, 
          firstWeek: date,
          firstCustomWeekId: weekId || u.firstCustomWeekId 
        } : u
      )
    );
    
    if (user && user.username === username) {
      setUser((prevUser) => prevUser ? { 
        ...prevUser, 
        firstWeek: date,
        firstCustomWeekId: weekId || prevUser.firstCustomWeekId 
      } : null);
    }
    
    toast({
      title: "First Week Set",
      description: `First week set for ${username}: ${date}`,
    });
  };

  const handleUpdateUserManager = (username: string, managerId: string | undefined) => {
    setUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.username === username ? { ...u, managerId } : u
      )
    );
    if (user && user.username === username) {
      setUser((prevUser) => prevUser ? { ...prevUser, managerId } : null);
    }
  };

  const handleUpdateUserDepartment = (username: string, departmentId: string | undefined) => {
    setUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.username === username ? { ...u, departmentId } : u
      )
    );
    if (user && user.username === username) {
      setUser((prevUser) => prevUser ? { ...prevUser, departmentId } : null);
    }
  };

  const handleToggleUserHidden = (username: string, hidden: boolean) => {
    setUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.username === username ? { ...u, hidden } : u
      )
    );
    if (user && user.username === username) {
      setUser((prevUser) => prevUser ? { ...prevUser, hidden } : null);
    }
  };

  const handleAddClient = (clientData: Omit<Client, "id">) => {
    const newId = `${clients.length + 1}`;
    const newClient: Client = {
      id: newId,
      ...clientData
    };
    setClients((prevClients) => [...prevClients, newClient]);
  };

  const handleUpdateClient = (id: string, clientData: Partial<Client>) => {
    setClients((prevClients) =>
      prevClients.map((client) =>
        client.id === id ? { ...client, ...clientData } : client
      )
    );
  };

  const handleDeleteClient = (id: string) => {
    const clientToDelete = clients.find(client => client.id === id);
    if (clientToDelete?.isDefault) {
      toast({
        title: "Cannot Delete",
        description: "Default clients cannot be deleted",
        variant: "destructive",
      });
      return;
    }
    
    const hasChildren = clients.some(client => client.parentId === id);
    if (hasChildren) {
      toast({
        title: "Cannot Delete",
        description: "This client has child clients. Please reassign or delete them first.",
        variant: "destructive",
      });
      return;
    }
    
    setUsers((prevUsers) => 
      prevUsers.map((user) => {
        if (user.selectedClients && user.selectedClients.includes(id)) {
          return {
            ...user,
            selectedClients: user.selectedClients.filter(clientId => clientId !== id)
          };
        }
        return user;
      })
    );
    
    setClients((prevClients) => prevClients.filter((client) => client.id !== id));
  };

  const handleAddDepartment = (departmentData: any) => {
    const newId = `${departments.length + 1}`;
    const newDepartment = {
      id: newId,
      ...departmentData
    };
    setDepartments((prevDepartments) => [...prevDepartments, newDepartment]);
  };

  const handleDeleteDepartment = (id: string) => {
    const usersInDepartment = users.filter(u => u.departmentId === id);
    
    if (usersInDepartment.length > 0) {
      toast({
        title: "Cannot Delete",
        description: "There are users assigned to this department",
        variant: "destructive",
      });
      return;
    }
    
    setDepartments((prevDepartments) => 
      prevDepartments.filter((dept) => dept.id !== id)
    );
    
    toast({
      title: "Department Deleted",
      description: "Department has been removed",
    });
  };

  const getVisibleUsers = () => {
    return users.filter(u => !u.hidden);
  };

  const getVisibleClients = () => {
    return clients.filter(c => !c.hidden).map(c => c.name);
  };

  const isUserHead = (user && users.some(u => u.user_head_id === user.id)) || false;

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {user && (
            <div className="fixed top-4 right-4 z-50 flex items-center gap-2 flex-wrap justify-end">
              <span className="text-sm text-gray-600">
                Logged in as: {user.username} ({user.role})
              </span>
              {user.role === 'admin' && (
                <>
                  <Link to="/view-users">
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      View Users
                    </Button>
                  </Link>
                  <Link to="/custom-weeks">
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Custom Weeks
                    </Button>
                  </Link>
                  <Link to="/user-manager">
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <UserCog className="h-4 w-4" />
                      User-Manager
                    </Button>
                  </Link>
                  <Link to="/first-weeks">
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      First Weeks
                    </Button>
                  </Link>
                  <Link to="/week-percentage">
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Week Percentage
                    </Button>
                  </Link>
                  <Link to="/departments">
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Departments
                    </Button>
                  </Link>
                  <Link to="/client-tree">
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <TreeDeciduous className="h-4 w-4" />
                      Client Tree
                    </Button>
                  </Link>
                  <Link to="/media-types">
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Film className="h-4 w-4" />
                      Media Types
                    </Button>
                  </Link>
                </>
              )}
              {user.role === 'manager' && (
                <Link to="/manager-view">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    View Team
                  </Button>
                </Link>
              )}
              {isUserHead && (
                <Link to="/user-head-view">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4" />
                    User Head View
                  </Button>
                </Link>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          )}
          <Routes>
            <Route
              path="/"
              element={
                user ? (
                  <div className="container mx-auto p-4 pt-16">
                    {user.role === 'admin' || user.firstWeek || user.firstCustomWeekId ? (
                      <TimeSheet 
                        userRole={user.role} 
                        firstWeek={user.firstWeek || (user.role === 'admin' ? '2024-01-01' : '')} 
                        currentUser={user}
                        users={users}
                        clients={clients}
                      />
                    ) : (
                      <div className="text-center p-8">
                        <h2 className="text-xl font-semibold mb-4">
                          Welcome! Please wait for an admin to set your first working week.
                        </h2>
                      </div>
                    )}
                  </div>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/login"
              element={
                !user ? (
                  <Login onLogin={handleLogin} users={users} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/view-users"
              element={
                user?.role === 'admin' ? (
                  <UserImpersonation clients={clients} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/custom-weeks"
              element={
                user?.role === 'admin' ? (
                  <CustomWeeks />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/user-manager"
              element={
                user?.role === 'admin' ? (
                  <UserManagerAssignment 
                    onUpdateUserManager={handleUpdateUserManager}
                    onUpdateUserDepartment={handleUpdateUserDepartment}
                    onToggleUserHidden={handleToggleUserHidden}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/first-weeks"
              element={
                user?.role === 'admin' ? (
                  <UserFirstWeekManagement />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/week-percentage"
              element={
                user?.role === 'admin' ? (
                  <UserWeekPercentage />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/manager-view"
              element={
                user?.role === 'manager' ? (
                  <ManagerView 
                    currentUser={user}
                    users={getVisibleUsers()}
                    clients={clients}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/client-tree"
              element={
                user?.role === 'admin' ? (
                  <ClientTree />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/departments"
              element={
                user?.role === 'admin' ? (
                  <div className="container mx-auto p-4 pt-16">
                    <div className="flex items-center justify-between mb-6">
                      <h1 className="text-2xl font-bold">Department Management</h1>
                      <Link to="/">
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <ArrowLeft className="h-4 w-4" />
                          Back to Dashboard
                        </Button>
                      </Link>
                    </div>
                    <DepartmentManagement 
                      departments={departments}
                      onAddDepartment={handleAddDepartment}
                      onDeleteDepartment={handleDeleteDepartment}
                    />
                  </div>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/media-types"
              element={
                user?.role === 'admin' ? (
                  <MediaTypeManagement />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/user-head-view"
              element={
                user && isUserHead ? (
                  <UserHeadView
                    currentUser={user}
                    clients={clients}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
