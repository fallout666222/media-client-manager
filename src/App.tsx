import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import TimeSheet from "./pages/TimeSheet";
import { Login } from "./components/Auth/Login";
import { UserManagement } from "./components/Auth/UserManagement";
import { FirstWeekManagement } from "./components/Auth/FirstWeekManagement";
import { useState } from "react";
import { User, UserFormData } from "./types/timesheet";
import { Button } from "./components/ui/button";
import { LogOut } from "lucide-react";
import { useToast } from "./hooks/use-toast";

const queryClient = new QueryClient();

// Initial users list
const INITIAL_USERS: User[] = [
  { username: "admin", password: "admin", role: "admin", firstWeek: "2024-01-01" },
  { username: "user", password: "user", role: "user" },
  { username: "manager", password: "manager", role: "manager", firstWeek: "2024-01-01" },
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
    // If the current user is the one being updated, update their state as well
    if (user && user.username === username) {
      setUser((prevUser) => prevUser ? { ...prevUser, firstWeek: date } : null);
    }
    toast({
      title: "First Week Set",
      description: `First week set for ${username}: ${date}`,
    });
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
              path="/"
              element={
                user ? (
                  <div className="container mx-auto p-4 pt-16">
                    {user.firstWeek ? (
                      <TimeSheet userRole={user.role} firstWeek={user.firstWeek} />
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
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;