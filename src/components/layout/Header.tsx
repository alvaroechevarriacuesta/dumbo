import React from 'react';
import { Menu, Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { isOpen, toggle } = useSidebar();
  const { logout } = useAuth();

  return (
    <header className="bg-secondary-50 dark:bg-secondary-900 px-4 py-3 min-h-[57px] flex items-center">
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
        </div>

        <div className="flex items-center space-x-2">
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

export default Header;