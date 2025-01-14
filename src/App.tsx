import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import TimeSheet from "./pages/TimeSheet";
import { Login } from "./components/Auth/Login";
import { UserManagement } from "./components/Auth/UserManagement";
import { useState } from "react";
import { User, UserFormData } from "./types/timesheet";
import { Button } from "./components/ui/button";
import { LogOut } from "lucide-react";
import { useToast } from "./hooks/use-toast";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<User | null>(null);
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
    // In a real application, this would make an API call
    // For now, we'll just show a success message
    toast({
      title: "User Created",
      description: `New ${userData.role} account created: ${userData.username}`,
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
                  <Login onLogin={handleLogin} />
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
                    <TimeSheet userRole={user.role} />
                    {user.role === "admin" && (
                      <div className="mt-8">
                        <UserManagement onCreateUser={handleCreateUser} />
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