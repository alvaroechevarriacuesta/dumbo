import React from 'react';
import { X, User, Plus, Trash2 } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import AddContextModal from '../chat/AddContextModal';

const Sidebar: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [deletingContextId, setDeletingContextId] = React.useState<string | null>(null);
  const { isOpen, close } = useSidebar();
  const { user } = useAuth();
  const { 
    activeContextId, 
    selectContext, 
    contexts, 
    isLoading, 
    error, 
    deleteContext,
    refreshContexts 
  } = useChat();

  const handleDeleteContext = async (contextId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this context? This action cannot be undone.')) {
      return;
    }

    setDeletingContextId(contextId);
    try {
      await deleteContext(contextId);
    } catch (error) {
      console.error('Failed to delete context:', error);
      alert('Failed to delete context. Please try again.');
    } finally {
      setDeletingContextId(null);
    }
  };

  const handleRetry = () => {
    refreshContexts();
  };

  return (
    <>
      <div className="w-80 h-full bg-white dark:bg-secondary-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 min-h-[57px] border-b border-secondary-200 dark:border-secondary-700">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">
            Contexts
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={close}
            className="p-1"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary-200 dark:bg-secondary-700">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="h-6 w-6 text-secondary-500" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                {user?.username}
              </p>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Error State */}
          {error && (
            <div className="p-4">
              <div className="p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
                <p className="text-error-700 dark:text-error-400 text-sm mb-2">{error}</p>
                <Button
                  onClick={handleRetry}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && !error && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <LoadingSpinner size="md" className="mx-auto mb-2" />
                <p className="text-sm text-secondary-500 dark:text-secondary-400">
                  Loading contexts...
                </p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && contexts.length === 0 && (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <p className="text-secondary-600 dark:text-secondary-400 mb-4">
                  No contexts yet
                </p>
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Context
                </Button>
              </div>
            </div>
          )}

          {/* Contexts List */}
          {!isLoading && !error && contexts.length > 0 && (
            <>
              {/* Add Context Button */}
              <div className="p-4 border-b border-secondary-200 dark:border-secondary-700">
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  variant="outline"
                  className="w-full justify-center"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Context
                </Button>
              </div>

              {/* Context List */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-2">
                  {contexts.map((context) => {
                    const isActive = activeContextId === context.id;
                    const isDeleting = deletingContextId === context.id;
                    
                    return (
                      <div
                        key={context.id}
                        className={`group relative mb-2 p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                          isActive
                            ? 'bg-primary-100 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                            : 'hover:bg-secondary-100 dark:hover:bg-secondary-700 border border-transparent'
                        }`}
                        onClick={() => !isDeleting && selectContext(context.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              isActive
                                ? 'text-primary-900 dark:text-primary-100'
                                : 'text-secondary-900 dark:text-white'
                            }`}>
                              {context.name}
                            </p>
                            <p className={`text-xs mt-1 truncate ${
                              isActive
                                ? 'text-primary-700 dark:text-primary-300'
                                : 'text-secondary-500 dark:text-secondary-400'
                            }`}>
                              {context.description}
                            </p>
                          </div>
                          
                          {/* Delete Button */}
                          <button
                            onClick={(e) => handleDeleteContext(context.id, e)}
                            disabled={isDeleting}
                            className="ml-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-error-100 dark:hover:bg-error-900/20 text-error-600 dark:text-error-400 disabled:opacity-50"
                          >
                            {isDeleting ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Context Modal */}
      <AddContextModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </>
  );
};

export default Sidebar;