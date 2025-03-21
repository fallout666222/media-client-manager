
import { UserIcon, LogOut, BarChart2, Users, Settings, Calendar, FolderTree, LineChart, Briefcase, Radio } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { User } from "@/types/timesheet";
import { Button } from "@/components/ui/button";
import NavButton from "@/components/Navigation/NavButton";
import { useSettings } from "@/contexts/SettingsContext";
import { ModeToggle } from "@/components/ui/mode-toggle";

interface AppHeaderProps {
  user: User | null;
  isUserHead?: boolean;
  onLogout: () => void;
}

export function AppHeader({ user, isUserHead, onLogout }: AppHeaderProps) {
  const navigate = useNavigate();
  const { darkTheme, language } = useSettings();

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-background border-b border-border h-14 flex items-center px-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-1">
          <Link to="/" className="font-bold text-lg mr-4">
            MCM
          </Link>
          
          {user && (
            <div className="hidden md:flex items-center gap-1">
              <NavButton to="/" icon={Calendar} label="TimeSheet" />
              
              <NavButton to="/planning" icon={LineChart} label="Planning" />
              
              {user.role === 'admin' && (
                <>
                  <NavButton to="/view-users" icon={Users} label="Users" />
                  <NavButton to="/client-tree" icon={FolderTree} label="Clients" />
                  <NavButton to="/media-types" icon={Radio} label="Media Types" />
                  <NavButton to="/departments" icon={Briefcase} label="Departments" />
                  <NavButton to="/custom-weeks" icon={Calendar} label="Custom Weeks" />
                </>
              )}
              
              {user.role === 'manager' && (
                <NavButton to="/manager-view" icon={BarChart2} label="Manager" />
              )}
              
              {isUserHead && (
                <NavButton to="/user-head-view" icon={BarChart2} label="Head View" />
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <ModeToggle />
          
          {user && (
            <>
              <Button
                variant="ghost"
                onClick={() => navigate("/settings")}
                size="icon"
                className="h-8 w-8"
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              <span className="hidden md:inline-block text-sm font-medium mr-2">
                {user.name || user.login || user.username}
              </span>
              
              <Button
                variant="ghost"
                onClick={handleLogout}
                size="icon"
                className="h-8 w-8"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {!user && (
            <Link to="/login">
              <Button variant="outline" size="sm" className="gap-2">
                <UserIcon className="h-4 w-4" />
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
