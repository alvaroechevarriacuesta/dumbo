import React, { useState } from 'react';
import { Menu, Sun, Moon, LogOut, Settings } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { isOpen, toggle } = useSidebar();
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutConfirm(false);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <>
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
            onClick={() => setShowLogoutConfirm(true)}
            className="p-2 text-error-600 hover:text-error-700 hover:bg-error-50 dark:text-error-400 dark:hover:text-error-300 dark:hover:bg-error-900/20"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>

    {/* Logout Confirmation Modal */}
    <Modal
      isOpen={showLogoutConfirm}
      onClose={() => setShowLogoutConfirm(false)}
      title="Confirm Logout"
      className="max-w-sm"
    >
      <div className="space-y-4">
        <p className="text-secondary-700 dark:text-secondary-300">
          Are you sure you want to log out?
        </p>
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowLogoutConfirm(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleLogout}
            className="bg-error-600 hover:bg-error-700 text-white"
          >
            Log Out
          </Button>
        </div>
      </div>
    </Modal>
    </>
  );
};

export default Header;