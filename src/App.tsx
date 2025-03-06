
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { LogOut, Users, Calendar, UserCog, CalendarDays, Percent, Eye, Building, ArrowLeft, TreeDeciduous, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
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

export function App() {
  return (
    <Router>
      <Toaster />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/timesheet" element={<TimeSheet />} />
        <Route path="/user-first-week" element={<UserFirstWeekManagement />} />
        <Route path="/user-week-percentage" element={<UserWeekPercentage />} />
        <Route path="/user-manager-assignment" element={<UserManagerAssignment />} />
        <Route path="/user-impersonation" element={<UserImpersonation />} />
        <Route path="/client-tree" element={<ClientTree />} />
        <Route path="/manager-view" element={<ManagerView />} />
        <Route path="/custom-weeks" element={<CustomWeeks />} />
        <Route path="/media-types" element={<MediaTypeManagement />} />
      </Routes>
    </Router>
  );
}

export default App;
