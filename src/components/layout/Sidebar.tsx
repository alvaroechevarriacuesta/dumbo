import React from 'react';
import { X, User, Plus, Info, Check } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import ContextInfoModal from '../chat/ContextInfoModal';

const Sidebar: React.FC = () => {
  const [isAddingContext, setIsAddingContext] = React.useState(false);
  const [newContextName, setNewContextName] = React.useState('');
  const [selectedContextInfo, setSelectedContextInfo] = React.useState<{id: string, name: string} | null>(null);
  const { isOpen, close } = useSidebar();
  const { user } = useAuth();
  const { 
    activeContextId, 
    selectContext, 
    contexts, 
    isLoading, 
    error, 
    refreshContexts,
    addContext
  } = useChat();

  const handleShowContextInfo = (contextId: string, contextName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedContextInfo({ id: contextId, name: contextName });
  };

  const handleRetry = () => {
    refreshContexts();
  };

  const handleAddContext = () => {
    setIsAddingContext(true);
  };

  const handleSaveContext = async () => {
    if (!newContextName.trim()) return;
    
    try {
      const contextId = await addContext({ name: newContextName.trim() });
      setNewContextName('');
      setIsAddingContext(false);
      // Context is now auto-selected in the addContext function
    } catch (error) {
      console.error('Failed to create context:', error);
    }
  };

  const handleCancelAdd = () => {
    setNewContextName('');
    setIsAddingContext(false);
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
                  onClick={handleAddContext}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Context
                </Button>
              </div>
            </div>
          )}

          {/* Contexts List */}
          {!isLoading && !error && contexts.length > 0 && (
            <>
              {/* Add Context Button */}
              <div className="p-4 border-b border-secondary-200 dark:border-secondary-700">
                {isAddingContext ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newContextName}
                      onChange={(e) => setNewContextName(e.target.value)}
                      placeholder="Context name..."
                      className="flex-1 px-3 py-2 text-sm border border-secondary-300 dark:border-secondary-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveContext();
                        } else if (e.key === 'Escape') {
                          handleCancelAdd();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSaveContext}
                      size="sm"
                      className="p-2"
                      disabled={!newContextName.trim()}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleAddContext}
                    variant="outline"
                    className="w-full justify-center"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Context
                  </Button>
                )}
              </div>

              {/* Context List */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-2">
                  {contexts.map((context) => {
                    const isActive = activeContextId === context.id;
                    
                    return (
                      <div
                        key={context.id}
                        className={`group relative mb-2 p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                          isActive
                            ? 'bg-primary-100 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                            : 'hover:bg-secondary-100 dark:hover:bg-secondary-700 border border-transparent'
                        }`}
                        onClick={() => selectContext(context.id)}
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
                          
                          {/* Info Button */}
                          <div className="flex items-center justify-center">
                            <button
                            onClick={(e) => handleShowContextInfo(context.id, context.name, e)}
                              className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-secondary-200 dark:hover:bg-secondary-600 text-secondary-600 dark:text-secondary-400"
                          >
                              <Info className="h-4 w-4" />
                          </button>
                          </div>
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

      {/* Context Info Modal */}
      {selectedContextInfo && (
        <ContextInfoModal
          isOpen={!!selectedContextInfo}
          onClose={() => setSelectedContextInfo(null)}
          contextId={selectedContextInfo.id}
          contextName={selectedContextInfo.name}
        />
      )}
    </>
  );
};

export default Sidebar;