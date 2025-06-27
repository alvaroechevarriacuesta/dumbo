import React from 'react';
import { Navigate } from 'react-router-dom';
import { useExtensionAuth } from '../contexts/ExtensionAuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface ExtensionProtectedRouteProps {
  children: React.ReactNode;
}

const ExtensionProtectedRoute: React.FC<ExtensionProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useExtensionAuth();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-secondary-600 dark:text-secondary-400">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ExtensionProtectedRoute;