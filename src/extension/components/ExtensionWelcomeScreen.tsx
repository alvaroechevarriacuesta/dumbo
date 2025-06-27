import React, { useEffect, useState } from 'react';
import { MessageCircle, Plus, Clock, ArrowRight } from 'lucide-react';
import { useExtensionChat } from '../hooks/useExtensionChat';
import { useSidebar } from '../../contexts/SidebarContext';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import type { ChatContext } from '../../types/chat';

const ExtensionWelcomeScreen: React.FC = () => {
  const { contexts, selectContext, isLoading } = useExtensionChat();
  const { openWithAction } = useSidebar();
  const [recentContexts, setRecentContexts] = useState<ChatContext[]>([]);

  useEffect(() => {
    // Get the 3 most recent contexts
    const recent = contexts.slice(0, 3);
    setRecentContexts(recent);
  }, [contexts]);

  const handleContextSelect = (contextId: string) => {
    selectContext(contextId);
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
            Welcome to Extendo Dumbo
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
                Recent Contexts
              </h2>
              {contexts.length > 3 && (
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
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentContexts.map((context) => (
                <div
                  key={context.id}
                  onClick={() => handleContextSelect(context.id)}
                  className="group p-6 bg-secondary-50 dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 cursor-pointer hover:shadow-lg hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-secondary-400 group-hover:text-primary-500 transition-colors duration-200" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                    {context.name}
                  </h3>
                  
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">
                    {formatContextDate(context.description)}
                  </p>
                  
                  <div className="flex items-center text-xs text-secondary-500 dark:text-secondary-500">
                    <div className="w-2 h-2 bg-success-500 rounded-full mr-2"></div>
                    Ready to chat
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
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
            What you can do with Extendo Dumbo
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
                <Plus className="w-6 h-6 text-accent-600 dark:text-accent-400" />
              </div>
              <h4 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
                Easy Organization
              </h4>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Create and manage contexts to keep your conversations organized
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-success-100 dark:bg-success-900/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-success-600 dark:text-success-400" />
              </div>
              <h4 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
                Persistent History
              </h4>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Your conversations are saved and accessible across sessions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtensionWelcomeScreen; 