
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
  managerOnly?: boolean;
  userHeadOnly?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  adminOnly = false,
  managerOnly = false,
  userHeadOnly = false
}: ProtectedRouteProps) => {
  const { user, isUserHead } = useApp();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  if (managerOnly && user.role !== 'manager' && user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  if (userHeadOnly && !isUserHead && user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};
