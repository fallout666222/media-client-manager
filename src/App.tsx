import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import TimeSheet from "./pages/TimeSheet";
import { Login } from "./components/Auth/Login";
import { UserManagement } from "./components/Auth/UserManagement";
import { FirstWeekManagement } from "./components/Auth/FirstWeekManagement";
import UserImpersonation from "./pages/UserImpersonation";
import CustomWeeks from "./pages/CustomWeeks";
import UserManagerAssignment from "./pages/UserManagerAssignment";
import { useState } from "react";
import { User, UserFormData } from "./types/timesheet";
import { Button } from "./components/ui/button";
import { LogOut, Users, Calendar, UserCog } from "lucide-react";
import { useToast } from "./hooks/use-toast";

const queryClient = new QueryClient();

const INITIAL_USERS: User[] = [
  { 
    id: "1",
    username: "admin", 
    password: "admin", 
    role: "admin", 
    firstWeek: "2024-01-01",
    selectedClients: ["Client A", "Client B"],
    selectedMediaTypes: ["TV", "Digital"]
  },
  { 
    id: "2",
    username: "user", 
    password: "user", 
    role: "user",
    managerId: "3",
    selectedClients: ["Client A"],
    selectedMediaTypes: ["TV"] 
  },
  { 
    id: "3",
    username: "manager", 
    password: "manager", 
    role: "manager", 
    firstWeek: "2024-01-01",
    selectedClients: ["Client B"],
    selectedMediaTypes: ["Digital"]
  },
];

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const { toast } = useToast();

  const handleLogin = (user: User) => {
    setUser(user);
  };

  const handleLogout = () => {
    setUser(null);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  const handleCreateUser = (userData: UserFormData) => {
    const newUser: User = {
      ...userData,
      selectedClients: [],
      selectedMediaTypes: []
    };
    setUsers((prevUsers) => [...prevUsers, newUser]);
    toast({
      title: "User Created",
      description: `New ${userData.role} account created: ${userData.username}`,
    });
  };

  const handleSetFirstWeek = (username: string, date: string) => {
    setUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.username === username ? { ...u, firstWeek: date } : u
      )
    );
    if (user && user.username === username) {
      setUser((prevUser) => prevUser ? { ...prevUser, firstWeek: date } : null);
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

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {user && (
            <div className="fixed top-4 right-4 flex items-center gap-4">
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
                </>
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
                    {user.firstWeek ? (
                      <TimeSheet 
                        userRole={user.role} 
                        firstWeek={user.firstWeek} 
                        currentUser={user}
                        users={users}
                      />
                    ) : (
                      <div className="text-center p-8">
                        <h2 className="text-xl font-semibold mb-4">
                          Welcome! Please wait for an admin to set your first working week.
                        </h2>
                      </div>
                    )}
                    {user.role === "admin" && (
                      <div className="mt-8 space-y-8">
                        <UserManagement onCreateUser={handleCreateUser} />
                        <FirstWeekManagement 
                          onSetFirstWeek={handleSetFirstWeek}
                          users={users}
                        />
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
                  <UserImpersonation users={users} />
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
                    users={users} 
                    onUpdateUserManager={handleUpdateUserManager} 
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
};

export default App;
