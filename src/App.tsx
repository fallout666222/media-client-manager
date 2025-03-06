
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { LogOut, Users, Calendar, UserCog, CalendarDays, Percent, Eye, Building, ArrowLeft, TreeDeciduous, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import Index from "@/pages/Index";
import TimeSheet from "@/pages/TimeSheet";
import UserFirstWeekManagement from "@/pages/UserFirstWeekManagement";
import UserWeekPercentage from "@/pages/UserWeekPercentage";
import UserManagerAssignment from "@/pages/UserManagerAssignment";
import UserImpersonation from "@/pages/UserImpersonation";
import ClientTree from "@/pages/ClientTree";
import ManagerView from "@/pages/ManagerView";
import CustomWeeks from "@/pages/CustomWeeks";
import MediaTypeManagement from "@/pages/MediaTypeManagement";
import { User, Client } from "@/types/timesheet";
import { getUsers, getClients } from "@/integrations/supabase/database";

export function App() {
  const [currentUser, setCurrentUser] = useState<User>({
    id: "default-user",
    username: "admin",
    role: "admin",
    firstWeek: "2023-01-01"
  });
  
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users from database
        const { data: usersData } = await getUsers();
        if (usersData && usersData.length > 0) {
          setUsers(usersData);
          // Set the first user as current user
          setCurrentUser({
            id: usersData[0].id,
            username: usersData[0].username || usersData[0].login || "admin",
            role: (usersData[0].role || usersData[0].type) as "admin" | "user" | "manager",
            firstWeek: usersData[0].firstWeek || usersData[0].first_week || "2023-01-01"
          });
        }

        // Fetch clients from database
        const { data: clientsData } = await getClients();
        if (clientsData) {
          setClients(clientsData);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handler functions for UserManagerAssignment
  const handleUpdateUserManager = (username: string, managerId: string | undefined) => {
    console.log(`Updating user ${username} with manager ID ${managerId}`);
  };

  const handleUpdateUserDepartment = (username: string, departmentId: string | undefined) => {
    console.log(`Updating user ${username} with department ID ${departmentId}`);
  };

  const handleToggleUserHidden = (username: string, hidden: boolean) => {
    console.log(`Toggling user ${username} hidden status to ${hidden}`);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading application data...</div>;
  }

  return (
    <Router>
      <Toaster />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route 
          path="/timesheet" 
          element={
            <TimeSheet 
              userRole={currentUser.role} 
              firstWeek={currentUser.firstWeek} 
              currentUser={currentUser} 
              users={users} 
              clients={clients} 
            />
          } 
        />
        <Route path="/user-first-week" element={<UserFirstWeekManagement />} />
        <Route path="/user-week-percentage" element={<UserWeekPercentage />} />
        <Route 
          path="/user-manager-assignment" 
          element={
            <UserManagerAssignment 
              onUpdateUserManager={handleUpdateUserManager}
              onUpdateUserDepartment={handleUpdateUserDepartment}
              onToggleUserHidden={handleToggleUserHidden}
            />
          } 
        />
        <Route 
          path="/user-impersonation" 
          element={<UserImpersonation clients={clients} />} 
        />
        <Route path="/client-tree" element={<ClientTree />} />
        <Route 
          path="/manager-view" 
          element={
            <ManagerView 
              currentUser={currentUser} 
              users={users} 
              clients={clients} 
            />
          } 
        />
        <Route path="/custom-weeks" element={<CustomWeeks />} />
        <Route path="/media-types" element={<MediaTypeManagement />} />
      </Routes>
    </Router>
  );
}

export default App;
