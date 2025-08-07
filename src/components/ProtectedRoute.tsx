import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'organizer' | 'volunteer';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If no profile data yet, show loading
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Allow admin access to all routes
  // Allow organizer access to admin routes
  // Restrict volunteer access to volunteer routes only
  if (requiredRole) {
    if (requiredRole === 'admin' && profile?.role !== 'admin') {
      return <Navigate to="/403" replace />;
    }
    if (requiredRole === 'organizer' && !['admin', 'organizer'].includes(profile?.role || '')) {
      return <Navigate to="/403" replace />;
    }
    if (requiredRole === 'volunteer' && profile?.role !== 'volunteer') {
      return <Navigate to="/403" replace />;
    }
  }

  // If no specific role required, check if user should be redirected to appropriate dashboard
  if (!requiredRole) {
    const currentPath = location.pathname;
    
    // If volunteer tries to access admin routes, redirect to volunteer dashboard
    if (profile?.role === 'volunteer' && currentPath.startsWith('/admin')) {
      return <Navigate to="/dashboard/volunteer" replace />;
    }
    
    // If admin/organizer tries to access volunteer routes, redirect to admin dashboard
    if (['admin', 'organizer'].includes(profile?.role || '') && currentPath.startsWith('/dashboard/volunteer')) {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;