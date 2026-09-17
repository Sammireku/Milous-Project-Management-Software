import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Verifying session...</p>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated -> Redirect to /login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Role-Based Access Control (RBAC)
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (user.role || '').toLowerCase();
    const isAdminUser = userRole === 'admin' || userRole === 'ceo' || userRole === 'system admin';
    const hasRole = allowedRoles.some((r) => {
      const rLower = r.toLowerCase();
      if (rLower === userRole) return true;
      if (isAdminUser && (rLower === 'admin' || rLower === 'ceo' || rLower === 'system admin')) return true;
      return false;
    });

    if (!hasRole) {
      return <Navigate to="/unauthorized" state={{ from: location, required: allowedRoles }} replace />;
    }
  }

  return <>{children}</>;
};
