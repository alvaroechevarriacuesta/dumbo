import React, { useState, useEffect } from 'react';
import { Menu, Sun, Moon, LogOut, Settings, Globe, Save } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useExtensionAuth } from '../contexts/ExtensionAuthContext';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const ExtensionHeader: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { isOpen, toggle } = useSidebar();
  const { logout } = useExtensionAuth();
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null);

  useEffect(() => {
    // Get current tab info
    const getCurrentTab = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        setCurrentTab(tab);
      } catch (error) {
        console.error('Failed to get current tab:', error);
      }
    };

    getCurrentTab();
  }, []);

  const handleSavePage = async () => {
    if (!currentTab?.url || !currentTab?.title) {
      toast.error('No page to save');
      return;
    }

    try {
      // Store page info for processing
      await chrome.storage.local.set({
        pendingPage: {
          url: currentTab.url,
          title: currentTab.title,
          timestamp: Date.now()
        }
      });
      
      toast.success(`Saved: ${currentTab.title}`);
    } catch (error) {
      console.error('Failed to save page:', error);
      toast.error('Failed to save page');
    }
  };

  return (
    <header className="bg-secondary-50 dark:bg-secondary-900 px-4 py-3 min-h-[57px] flex items-center border-b border-secondary-200 dark:border-secondary-700">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-4">
          {/* Toggle Button - Only shows when sidebar is closed */}
          {!isOpen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggle}
              className="p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          {/* Current page info */}
          {currentTab && (
            <div className="flex items-center space-x-2 text-sm text-secondary-600 dark:text-secondary-400">
              <Globe className="h-4 w-4" />
              <span className="truncate max-w-48">
                {currentTab.title || currentTab.url}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSavePage}
            className="p-2"
            title="Save current page (Ctrl+J / Cmd+J)"
          >
            <Save className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="p-2"
          >
            <Settings className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="p-2"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="p-2 text-error-600 hover:text-error-700 hover:bg-error-50 dark:text-error-400 dark:hover:text-error-300 dark:hover:bg-error-900/20"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default ExtensionHeader;