import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useSidebar } from '../../contexts/SidebarContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isOpen } = useSidebar();

  return (
    <div className="h-screen flex bg-secondary-50 dark:bg-secondary-900 overflow-hidden">
      {/* Sidebar - Width changes based on state */}
      <div className={`transition-all duration-300 ease-in-out border-r border-secondary-200 dark:border-secondary-700 ${
        isOpen ? 'w-80' : 'w-0'
      } flex-shrink-0 overflow-hidden`}>
        <Sidebar />
      </div>

      {/* Main Content - Always takes remaining space */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;