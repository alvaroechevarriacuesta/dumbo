import React from 'react';
import { X, User, Brain, Code, BookOpen, Lightbulb, Zap, Plus, Palette, Calculator, Globe } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import Button from '../ui/Button';
import AddContextModal from '../chat/AddContextModal';
import type { ChatContext } from '../../types/chat';

const chatContexts: ChatContext[] = [
  {
    id: 'general',
    name: 'General Chat',
    description: 'General purpose conversation',
    icon: 'Brain',
  },
  {
    id: 'coding',
    name: 'Code Assistant',
    description: 'Programming help and code review',
    icon: 'Code',
  },
  {
    id: 'learning',
    name: 'Learning Tutor',
    description: 'Educational support and explanations',
    icon: 'BookOpen',
  },
  {
    id: 'creative',
    name: 'Creative Writing',
    description: 'Creative writing and brainstorming',
    icon: 'Lightbulb',
  },
  {
    id: 'productivity',
    name: 'Productivity Coach',
    description: 'Task management and productivity tips',
    icon: 'Zap',
  },
];

const iconMap = {
  Brain,
  Code,
  BookOpen,
  Lightbulb,
  Zap,
  Palette,
  Calculator,
  Globe,
};

const Sidebar: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const { isOpen, close } = useSidebar();
  const { user } = useAuth();
  const { activeContextId, selectContext, sessions, contexts } = useChat();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <div
        className="w-80 h-full bg-white dark:bg-secondary-800 flex flex-col"
      >
        {/* Header - matches main header height */}
        <div className="flex items-center justify-between px-4 py-3 min-h-[57px]">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">
            Dumbo
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
        <div className="p-4">
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

        {/* Add Context Button */}
        <div className="px-4 pb-4">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            variant="outline"
            className="w-full justify-start"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Context
          </Button>
        </div>

        {/* Context List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {contexts.map((context) => {
              const IconComponent = iconMap[context.icon as keyof typeof iconMap] || Brain;
              const isActive = activeContextId === context.id;
              const hasMessages = sessions[context.id]?.messages.length > 0;
              
              return (
                <button
                  key={context.id}
                  onClick={() => selectContext(context.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors duration-200 group ${
                    isActive
                      ? 'bg-primary-100 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                      : 'hover:bg-secondary-100 dark:hover:bg-secondary-700'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-primary-200 dark:bg-primary-900/40'
                        : 'bg-primary-100 dark:bg-primary-900/20 group-hover:bg-primary-200 dark:group-hover:bg-primary-900/40'
                    }`}>
                      <IconComponent className={`h-4 w-4 ${
                        isActive
                          ? 'text-primary-700 dark:text-primary-300'
                          : 'text-primary-600 dark:text-primary-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${
                          isActive
                            ? 'text-primary-900 dark:text-primary-100'
                            : 'text-secondary-900 dark:text-white'
                        }`}>
                          {context.name}
                        </p>
                      </div>
                      <p className={`text-xs mt-1 ${
                        isActive
                          ? 'text-primary-700 dark:text-primary-300'
                          : 'text-secondary-500 dark:text-secondary-400'
                      }`}>
                        {context.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
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