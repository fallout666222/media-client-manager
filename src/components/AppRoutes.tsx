import { Routes, Route, Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import TimeSheet from "@/pages/TimeSheet";
import { Login } from "@/components/Auth/Login";
import DepartmentManagement from "@/components/Admin/DepartmentManagement";
import UserImpersonation from "@/pages/UserImpersonation";
import CustomWeeks from "@/pages/CustomWeeks";
import UserManagerAssignment from "@/pages/UserManagerAssignment";
import UserFirstWeekManagement from "@/pages/UserFirstWeekManagement";
import UserWeekPercentage from "@/pages/UserWeekPercentage";
import ManagerView from "@/pages/ManagerView";
import ClientTree from "@/pages/ClientTree";
import MediaTypeManagement from "@/pages/MediaTypeManagement";
import SettingsPage from "@/pages/Settings";
import UserHeadView from "@/pages/UserHeadView";
import Planning from "@/pages/Planning";
import PlanningManagement from "@/pages/PlanningManagement";
import { AdfsCallback } from "@/pages/AuthCallbacks";
import SamlCallback from "@/pages/SamlCallback";
import AzureCallback from "@/pages/AzureCallback";
import ResetPassword from "@/pages/ResetPassword";
import { useApp } from "@/contexts/AppContext";

const AppRoutes = () => {
  const { 
    user, 
    loading, 
    handleLogin, 
    handleLogout, 
    isUserHead,
    clients,
    users,
    handleAddDepartment,
    handleDeleteDepartment,
    departments,
    getVisibleUsers,
    handleUpdateUserManager,
    handleUpdateUserDepartment,
    handleToggleUserHidden
  } = useApp();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          user ? (
            <div className="container mx-auto p-4 pt-16">
              {user.role === 'admin' || user.firstWeek || user.firstCustomWeekId ? (
                <>
                  <TimeSheet 
                    userRole={user.role} 
                    firstWeek={user.firstWeek || (user.role === 'admin' ? '2024-01-01' : '')} 
                    currentUser={user} 
                    users={users} 
                    clients={clients} 
                  />
                </>
              ) : (
                <div className="text-center p-8">
                  <h2 className="text-xl font-semibold mb-4">
                    Welcome! Please wait for an admin to set your first working week.
                  </h2>
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
        element={!user ? <Login onLogin={handleLogin} users={users} /> : <Navigate to="/" replace />} 
      />

      <Route 
        path="/reset-password" 
        element={!user ? <ResetPassword /> : <Navigate to="/" replace />} 
      />

      <Route path="/auth/adfs-callback" element={<AdfsCallback />} />
      <Route path="/auth/saml-callback" element={<SamlCallback />} />
      <Route path="/auth/azure-callback" element={<AzureCallback />} />

      <Route 
        path="/planning" 
        element={
          user ? (
            <Planning 
              currentUser={user} 
              clients={clients} 
            />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      <Route 
        path="/planning-management" 
        element={
          user?.role === 'admin' ? (
            <PlanningManagement />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />

      <Route 
        path="/view-users" 
        element={user?.role === 'admin' ? <UserImpersonation clients={clients} /> : <Navigate to="/" replace />} 
      />

      <Route 
        path="/custom-weeks" 
        element={user?.role === 'admin' ? <CustomWeeks /> : <Navigate to="/" replace />} 
      />

      <Route 
        path="/user-manager" 
        element={
          user?.role === 'admin' ? (
            <UserManagerAssignment 
              onUpdateUserManager={handleUpdateUserManager} 
              onUpdateUserDepartment={handleUpdateUserDepartment} 
              onToggleUserHidden={handleToggleUserHidden} 
            />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />

      <Route 
        path="/first-weeks" 
        element={user?.role === 'admin' ? <UserFirstWeekManagement /> : <Navigate to="/" replace />} 
      />

      <Route 
        path="/week-percentage" 
        element={user?.role === 'admin' ? <UserWeekPercentage /> : <Navigate to="/" replace />} 
      />

      <Route 
        path="/manager-view" 
        element={
          user?.role === 'manager' ? (
            <ManagerView currentUser={user} users={getVisibleUsers()} clients={clients} />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />

      <Route 
        path="/client-tree" 
        element={user?.role === 'admin' ? <ClientTree /> : <Navigate to="/" replace />} 
      />

      <Route 
        path="/departments" 
        element={
          user?.role === 'admin' ? (
            <div className="container mx-auto p-4 pt-16">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Department Management</h1>
                <Link to="/">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
              <DepartmentManagement 
                departments={departments} 
                onAddDepartment={handleAddDepartment} 
                onDeleteDepartment={handleDeleteDepartment} 
              />
            </div>
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />

      <Route 
        path="/media-types" 
        element={user?.role === 'admin' ? <MediaTypeManagement /> : <Navigate to="/" replace />} 
      />

      <Route 
        path="/user-head-view" 
        element={
          user && isUserHead ? (
            <UserHeadView currentUser={user} clients={clients} />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />

      <Route 
        path="/settings" 
        element={user ? <SettingsPage currentUser={user} /> : <Navigate to="/login" replace />} 
      />
    </Routes>
  );
};

export default AppRoutes;
