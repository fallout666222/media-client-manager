
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import { AppHeader } from "./components/Navigation/AppHeader";
import { AppRoutes } from "./components/AppRoutes";
import { SettingsProvider } from "./contexts/SettingsContext";
import { useApp } from "./contexts/AppContext";

// Initialize QueryClient
const queryClient = new QueryClient();

function AppContent() {
  const { user, isUserHead, handleLogout } = useApp();

  return (
    <SettingsProvider userId={user?.id}>
      <AppHeader 
        user={user} 
        isUserHead={isUserHead}
        onLogout={handleLogout} 
      />
      <AppRoutes />
    </SettingsProvider>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
