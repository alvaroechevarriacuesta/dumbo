import React, { useState, useEffect } from 'react';
import { X, User, Plus, Info, Check, FileText, Loader2 } from 'lucide-react';
import { useExtensionChat } from '../hooks/useExtensionChat';
import { extensionSupabase } from '../../lib/extension-supabase';
import { ContentProcessor } from '../../services/contentProcessor';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import type { Session } from '@supabase/supabase-js';
import ExtensionContextInfoModal from './ExtensionContextInfoModal';
import toast from 'react-hot-toast';

interface ExtensionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  domText: string;
  originalUrl: string;
  pageTitle: string;
}

const ExtensionPopup: React.FC<ExtensionPopupProps> = ({ isOpen, onClose, domText, originalUrl, pageTitle }) => {
  const [isAddingContext, setIsAddingContext] = useState(false);
  const [newContextName, setNewContextName] = useState('');
  const [selectedContextInfo, setSelectedContextInfo] = useState<{id: string, name: string} | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [processingContextId, setProcessingContextId] = useState<string | null>(null);
  const { 
    activeContextId, 
    selectContext, 
    contexts, 
    isLoading, 
    error, 
    refreshContexts,
    addContext
  } = useExtensionChat();

  useEffect(() => {
    // Get current session
    extensionSupabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = extensionSupabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close popup when Escape is pressed
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

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
      await addContext({ name: newContextName.trim() });
      setNewContextName('');
      setIsAddingContext(false);
    } catch (error) {
      console.error('Failed to create context:', error);
    }
  };

  const handleCancelAdd = () => {
    setNewContextName('');
    setIsAddingContext(false);
  };

  const handleLogout = async () => {
    try {
      await extensionSupabase.auth.signOut();
      onClose();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleProcessContent = async (contextId: string) => {
    if (!domText || !originalUrl) {
      toast.error('No content to process');
      return;
    }

    // Mark this context as processing
    setProcessingContextId(contextId);
    
    try {
      console.log('Processing content for context:', contextId);
      const results = await ContentProcessor.processCurrentTabContent(domText, originalUrl, [contextId], pageTitle);
      
      const totalChunks = results.reduce((sum, result) => sum + result.totalChunks, 0);
      toast.success(`Successfully processed ${totalChunks} chunks from this page`);
      
      // Close the popup after successful processing
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Failed to process content:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process content');
    } finally {
      // Clear processing state
      setProcessingContextId(null);
    }
  };

  if (!isOpen) return null;

  const hasContent = domText && domText.trim().length > 0;

  return (
    <>
      {/* Popup Window */}
      <div className="w-full h-full bg-white dark:bg-secondary-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-secondary-200 dark:border-secondary-700">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">
            Extendo Dumbo
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content Status */}
        {hasContent && (
          <div className="px-4 py-3 bg-primary-50 dark:bg-primary-900/20 border-b border-primary-200 dark:border-primary-800">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary-900 dark:text-primary-100">
                  Content Ready: {pageTitle || 'Page Content'}
                </p>
                <p className="text-xs text-primary-700 dark:text-primary-300 truncate">
                  {originalUrl && (
                    <span className="mr-2">
                      {(() => {
                        try {
                          return new URL(originalUrl).hostname;
                        } catch {
                          return originalUrl;
                        }
                      })()}
                    </span>
                  )}
                  {domText.length} characters extracted
                </p>
              </div>
            </div>
          </div>
        )}

        {/* DOM Text Info */}
        <div className="px-4 py-2 bg-secondary-50 dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-700">
          <p className="text-xs text-secondary-600 dark:text-secondary-400">
            DOM Text: {domText.length > 100 ? `${domText.substring(0, 100)}...` : domText}
          </p>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-secondary-200 dark:bg-secondary-700">
              <div className="w-full h-full flex items-center justify-center">
                <User className="h-4 w-4 text-secondary-500" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                {session?.user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate">
                {session?.user?.email || 'Loading...'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="p-1 text-error-600 hover:text-error-700 hover:bg-error-50 dark:text-error-400 dark:hover:text-error-300 dark:hover:bg-error-900/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
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
                    const isProcessingThis = processingContextId === context.id;
                    
                    return (
                      <div
                        key={context.id}
                        className={`group relative mb-2 p-3 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-primary-100 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                            : 'hover:bg-secondary-100 dark:hover:bg-secondary-700 border border-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => {
                              selectContext(context.id);
                              if (!hasContent) {
                                onClose();
                              }
                            }}
                          >
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
                              {context.description || 'No description'}
                            </p>
                            
                            {/* Process Content Button */}
                            {hasContent && (
                              <div className="mt-2">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleProcessContent(context.id);
                                  }}
                                  size="sm"
                                  variant="outline"
                                  disabled={isProcessingThis}
                                  className="w-full text-xs"
                                >
                                  {isProcessingThis ? (
                                    <>
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      <FileText className="h-3 w-3 mr-1" />
                                      Add Page to Context
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          {/* Info Button */}
                          <div className="flex items-center justify-center ml-2">
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
        <ExtensionContextInfoModal
          contextId={selectedContextInfo.id}
          contextName={selectedContextInfo.name}
          isOpen={!!selectedContextInfo}
          onClose={() => setSelectedContextInfo(null)}
        />
      )}
    </>
  );
};

export default ExtensionPopup; 