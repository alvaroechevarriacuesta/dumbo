import React from 'react';
import ExtensionHeader from './ExtensionHeader';
import ExtensionSidebar from './ExtensionSidebar';
import { useSidebar } from '../../contexts/SidebarContext';

interface ExtensionLayoutProps {
  children: React.ReactNode;
}

const ExtensionLayout: React.FC<ExtensionLayoutProps> = ({ children }) => {
  const { isOpen } = useSidebar();

  return (
    <div className="h-full flex bg-secondary-50 dark:bg-secondary-900 overflow-hidden">
      {/* Sidebar - Width changes based on state */}
      <div className={`transition-all duration-300 ease-in-out ${
        isOpen ? 'w-80 border-r border-secondary-200 dark:border-secondary-700' : 'w-0'
      } flex-shrink-0 overflow-hidden`}>
        <ExtensionSidebar />
      </div>

      {/* Main Content - Always takes remaining space */}
      <div className="flex flex-col flex-1 min-w-0">
        <ExtensionHeader />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ExtensionLayout;