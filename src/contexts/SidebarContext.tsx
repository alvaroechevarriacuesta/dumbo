import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  open: () => void;
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

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, close, open }}>
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