
import { Button } from "@/components/ui/button";
import { NavButton } from "./NavButton";
import { User } from "@/types/timesheet";
import { 
  LogOut, 
  Users, 
  Calendar, 
  UserCog, 
  CalendarDays, 
  Percent, 
  Eye, 
  Building, 
  TreeDeciduous, 
  Film, 
  Settings,
  UserCircle
} from "lucide-react";

interface AppHeaderProps {
  user: User | null;
  isUserHead: boolean;
  onLogout: () => void;
}

export function AppHeader({ user, isUserHead, onLogout }: AppHeaderProps) {
  if (!user) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 flex-wrap justify-end">
      <span className="text-sm text-gray-600">
        Logged in as: {user.username} ({user.role})
      </span>
      
      <NavButton to="/settings">
        <Settings className="h-4 w-4" />
        Settings
      </NavButton>
      
      {user.role === 'admin' && (
        <>
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
        </>
      )}
      
      {user.role === 'manager' && (
        <NavButton to="/manager-view">
          <Eye className="h-4 w-4" />
          View Team
        </NavButton>
      )}
      
      {isUserHead && (
        <NavButton to="/user-head-view">
          <UserCircle className="h-4 w-4" />
          User Head View
        </NavButton>
      )}
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onLogout} 
        className="flex items-center gap-2"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </div>
  );
}
