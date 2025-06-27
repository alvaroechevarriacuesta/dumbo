import React from 'react';
import { Navigate } from 'react-router-dom';
import { useExtensionAuth } from '../contexts/ExtensionAuthContext';
import ExtensionAuthForm from '../components/ExtensionAuthForm';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const ExtensionAuthPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useExtensionAuth();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <ExtensionAuthForm />;
};

export default ExtensionAuthPage;