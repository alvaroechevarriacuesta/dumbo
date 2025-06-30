import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  open: () => void;
  openWithAction?: (action?: 'add-context' | 'view-all') => void;
  closeOnMobile: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(() => {
    // Check if we're on desktop and get stored preference
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sidebarOpen');
      if (stored !== null) {
        return JSON.parse(stored);
      }
      // Default to open on desktop, closed on mobile
      return window.innerWidth >= 768;
    }
    return false;
  });

  const toggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };
  
  const close = () => {
    setIsOpen(false);
    localStorage.setItem('sidebarOpen', JSON.stringify(false));
  };
  
  const open = () => {
    setIsOpen(true);
    localStorage.setItem('sidebarOpen', JSON.stringify(true));
  };

  const closeOnMobile = () => {
    // Only close if we're on a mobile/small screen
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      close();
    }
  };
  const openWithAction = (action?: 'add-context' | 'view-all') => {
    open();
    // We can add action-specific logic here later if needed
    // For now, just opening the sidebar is sufficient
  };

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, close, open, openWithAction, closeOnMobile }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};