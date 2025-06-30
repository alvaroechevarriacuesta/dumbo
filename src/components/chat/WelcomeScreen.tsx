import React, { useEffect, useState } from 'react';
import { MessageCircle, Plus, Clock, ArrowRight, MoreHorizontal } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { useSidebar } from '../../contexts/SidebarContext';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import ContextInfoModal from './ContextInfoModal';
import type { ChatContext } from '../../types/chat';

const WelcomeScreen: React.FC = () => {
  const { contexts, selectContext, isLoading, refreshContexts, isExtension } = useChat();
  const { openWithAction, closeOnMobile } = useSidebar();
  const [recentContexts, setRecentContexts] = useState<ChatContext[]>([]);
  const [selectedContextInfo, setSelectedContextInfo] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    // Get the 3 most recent contexts for single row layout
    const recent = contexts.slice(0, 3);
    setRecentContexts(recent);
  }, [contexts]);

  const handleContextSelect = (contextId: string) => {
    selectContext(contextId);
    // Close sidebar on mobile after selecting context
    closeOnMobile();
  };

  const handleShowContextInfo = (contextId: string, contextName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedContextInfo({ id: contextId, name: contextName });
  };
  const formatContextDate = (description: string): string => {
    // Extract date from description like "Created 12/27/2024"
    const match = description.match(/Created (\d{1,2}\/\d{1,2}\/\d{4})/);
    if (match) {
      const date = new Date(match[1]);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }
    return description;
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-secondary-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-secondary-600 dark:text-secondary-400">
            Loading your contexts...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white dark:bg-secondary-900 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-secondary-900 dark:text-white mb-4">
            Welcome to Dumbo
          </h1>
          <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto leading-relaxed">
            Your intelligent AI assistant for contextual conversations. Select a context to continue your work or create a new one to get started.
          </p>
        </div>

        {/* Recent Contexts */}
        {recentContexts.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-secondary-900 dark:text-white flex items-center">
                <Clock className="w-6 h-6 mr-3 text-primary-500" />
                Your Contexts
              </h2>
              {contexts.length > 6 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openWithAction?.('view-all')}
                  className="text-primary-600 dark:text-primary-400"
                >
                  View all {contexts.length} contexts
                </Button>
              )}
            </div>
            
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {recentContexts.map((context) => (
                <div
                  key={context.id}
                  className="group relative p-6 bg-secondary-50 dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
                >
                  {/* Context Info Button */}
                  <div className="absolute top-3 right-3 z-10">
                    <button
                      onClick={(e) => handleShowContextInfo(context.id, context.name, e)}
                      className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800 shadow-md hover:shadow-lg border border-secondary-200 dark:border-secondary-600 hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-600 dark:text-secondary-300 hover:text-secondary-800 dark:hover:text-secondary-100 transition-all duration-200"
                      title="Context settings"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Clickable area for selecting context */}
                  <div 
                    onClick={() => handleContextSelect(context.id)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4 pr-12">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    </div>
                  
                    <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200 pr-12">
                    {context.name}
                    </h3>
                  
                    <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4 pr-12">
                    {formatContextDate(context.description)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Create New Context */}
          <div className="p-8 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-2xl border border-primary-200 dark:border-primary-800">
            <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl flex items-center justify-center mb-6">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-3">
              Create New Context
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400 mb-6 leading-relaxed">
              Start a fresh conversation with a new context. Perfect for organizing different topics or projects.
            </p>
            <Button
              onClick={() => openWithAction?.('add-context')}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Context
            </Button>
          </div>

          {/* Browse All Contexts */}
          <div className="p-8 bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-800 dark:to-secondary-700 rounded-2xl border border-secondary-200 dark:border-secondary-600">
            <div className="w-16 h-16 bg-gradient-to-r from-secondary-600 to-secondary-700 rounded-xl flex items-center justify-center mb-6">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-3">
              Browse All Contexts
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400 mb-6 leading-relaxed">
              View and manage all your contexts. Access your complete conversation history and organize your work.
            </p>
            <Button
              variant="outline"
              onClick={() => openWithAction?.('view-all')}
              className="w-full"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              View All Contexts
            </Button>
          </div>
        </div>

        {/* Empty State */}
        {contexts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center">
              <MessageCircle className="w-12 h-12 text-secondary-400" />
            </div>
            <h3 className="text-2xl font-semibold text-secondary-900 dark:text-white mb-4">
              No contexts yet
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400 mb-8 max-w-md mx-auto">
              Create your first context to start having intelligent conversations with your AI assistant.
            </p>
            <Button
              onClick={() => openWithAction?.('add-context')}
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Context
            </Button>
          </div>
        )}

        {/* Features Overview */}
        <div className="mt-16 pt-12 border-t border-secondary-200 dark:border-secondary-700">
          <h2 className="text-2xl font-semibold text-secondary-900 dark:text-white mb-8 text-center">
            What you can do with Dumbo
          </h2>
          
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h4 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
                Contextual Conversations
              </h4>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Organize your chats by context for better focus and continuity
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-accent-100 dark:bg-accent-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
                Intelligent Responses
              </h4>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Get detailed, comprehensive answers powered by advanced AI
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-success-100 dark:bg-success-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-success-600 dark:text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
                Rich Formatting
              </h4>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Enjoy beautifully formatted responses with markdown support
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Context Info Modal */}
      {selectedContextInfo && (
        <ContextInfoModal
          isOpen={!!selectedContextInfo}
          onClose={() => setSelectedContextInfo(null)}
          contextId={selectedContextInfo.id}
          contextName={selectedContextInfo.name}
          isExtension={isExtension}
        />
      )}
    </div>
  );
};

export default WelcomeScreen;