
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import Index from '@/pages/Index';
import TimeSheet from '@/pages/TimeSheet';
import UserImpersonation from '@/pages/UserImpersonation';
import UserFirstWeekManagement from '@/pages/UserFirstWeekManagement';
import UserManagerAssignment from '@/pages/UserManagerAssignment';
import Settings from '@/pages/Settings';
import ClientTree from '@/pages/ClientTree';
import { ProtectedRoute } from './ProtectedRoute';
import { Login } from './Auth/Login';
import { AdfsCallback, SamlCallback } from '@/pages/AuthCallbacks';
import CustomWeeks from '@/pages/CustomWeeks';
import MediaTypeManagement from '@/pages/MediaTypeManagement';
import UserHeadView from '@/pages/UserHeadView';
import ManagerView from '@/pages/ManagerView';
import UserWeekPercentage from '@/pages/UserWeekPercentage';

export const AppRoutes = () => {
  const { user, users, loading, handleLogin } = useApp();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Loading...</p>
          <div className="w-8 h-8 border-4 border-t-blue-500 border-b-transparent border-l-transparent border-r-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login onLogin={handleLogin} users={users} /> : <Navigate to="/" />} />
      <Route path="/auth/adfs-callback" element={<AdfsCallback />} />
      <Route path="/auth/saml-callback" element={<SamlCallback />} />
      
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/timesheet" element={<ProtectedRoute><TimeSheet /></ProtectedRoute>} />
      <Route path="/timesheet/:userId" element={<ProtectedRoute><TimeSheet /></ProtectedRoute>} />
      <Route path="/timesheet/:userId/:weekId" element={<ProtectedRoute><TimeSheet /></ProtectedRoute>} />
      
      <Route path="/user-impersonation" element={<ProtectedRoute adminOnly><UserImpersonation /></ProtectedRoute>} />
      <Route path="/user-first-week" element={<ProtectedRoute adminOnly><UserFirstWeekManagement /></ProtectedRoute>} />
      <Route path="/user-manager" element={<ProtectedRoute adminOnly><UserManagerAssignment /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/client-tree" element={<ProtectedRoute adminOnly><ClientTree /></ProtectedRoute>} />
      <Route path="/custom-weeks" element={<ProtectedRoute adminOnly><CustomWeeks /></ProtectedRoute>} />
      <Route path="/media-types" element={<ProtectedRoute adminOnly><MediaTypeManagement /></ProtectedRoute>} />
      <Route path="/user-head-view" element={<ProtectedRoute userHeadOnly><UserHeadView /></ProtectedRoute>} />
      <Route path="/manager-view" element={<ProtectedRoute managerOnly><ManagerView /></ProtectedRoute>} />
      <Route path="/user-week-percentage" element={<ProtectedRoute adminOnly><UserWeekPercentage /></ProtectedRoute>} />
    </Routes>
  );
};
