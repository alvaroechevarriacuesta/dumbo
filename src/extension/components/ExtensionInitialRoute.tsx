import React from 'react';
import { Navigate } from 'react-router-dom';
import { useExtensionAuth } from '../contexts/ExtensionAuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const ExtensionInitialRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useExtensionAuth();

  console.log('ExtensionInitialRoute - RENDER - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);

  if (isLoading) {
    console.log('ExtensionInitialRoute - Showing loading spinner');
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

  // If not authenticated, redirect to auth page
  if (!isAuthenticated) {
    console.log('ExtensionInitialRoute - NOT AUTHENTICATED - Redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  // If authenticated, redirect to main app
  console.log('ExtensionInitialRoute - AUTHENTICATED - Redirecting to /chat');
  return <Navigate to="/chat" replace />;
};

export default ExtensionInitialRoute; 