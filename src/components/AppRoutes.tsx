import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Index } from "@/pages/Index";
import { TimeSheet } from "@/pages/TimeSheet";
import { Settings } from "@/pages/Settings";
import { Planning } from "@/pages/Planning";
import { CustomWeeks } from "@/pages/CustomWeeks";
import { ClientTree } from "@/pages/ClientTree";
import { MediaTypeManagement } from "@/pages/MediaTypeManagement";
import { UserFirstWeekManagement } from "@/pages/UserFirstWeekManagement";
import { UserWeekPercentage } from "@/pages/UserWeekPercentage";
import { UserManagerAssignment } from "@/pages/UserManagerAssignment";
import { UserImpersonation } from "@/pages/UserImpersonation";
import { UserHeadView } from "@/pages/UserHeadView";
import { ManagerView } from "@/pages/ManagerView";
import { AuthCallbacks } from "@/pages/AuthCallbacks";
import { useApp } from "@/contexts/AppContext";
import { useEffect, useState } from "react";
import PlanningManagement from "@/pages/PlanningManagement";

export const AppRoutes = () => {
  const { user, isUserHead } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [previousLocation, setPreviousLocation] = useState<string | null>(null);

  useEffect(() => {
    if (user && location.pathname === "/auth/vk") {
      navigate(previousLocation || "/");
    }
  }, [user, location, navigate, previousLocation]);

  useEffect(() => {
    if (!user && location.pathname !== "/auth/vk") {
      setPreviousLocation(location.pathname);
    }
  }, [user, location]);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/timesheet" element={<TimeSheet />} />
      <Route path="/timesheet/:weekId" element={<TimeSheet />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/planning" element={<Planning />} />
      <Route path="/planning-management" element={user?.type === 'Administrator' ? <PlanningManagement /> : <Navigate to="/" />} />
      <Route path="/custom-weeks" element={user?.type === 'Administrator' ? <CustomWeeks />} : <Navigate to="/" />} />
      <Route path="/client-tree" element={user?.type === 'Administrator' ? <ClientTree />} : <Navigate to="/" />} />
      <Route path="/media-type-management" element={user?.type === 'Administrator' ? <MediaTypeManagement />} : <Navigate to="/" />} />
      <Route path="/user-first-week-management" element={user?.type === 'Administrator' ? <UserFirstWeekManagement />} : <Navigate to="/" />} />
      <Route path="/user-week-percentage" element={user?.type === 'Administrator' ? <UserWeekPercentage />} : <Navigate to="/" />} />
      <Route path="/user-manager-assignment" element={user?.type === 'Administrator' ? <UserManagerAssignment />} : <Navigate to="/" />} />
      <Route path="/user-impersonation" element={user?.type === 'Administrator' ? <UserImpersonation />} : <Navigate to="/" />} />
      <Route path="/user-head-view" element={isUserHead ? <UserHeadView />} : <Navigate to="/" />} />
      <Route path="/manager-view" element={<ManagerView />} />
      <Route path="/auth/vk" element={<AuthCallbacks />} />
      <Route path="/auth/google" element={<AuthCallbacks />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};
