import React from 'react';
import { Home, Plus, History, Settings, Moon, Sun, Wifi, WifiOff } from 'lucide-react';
import { Button } from '../UI/Button';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  isOffline: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentPage,
  onPageChange,
  darkMode,
  onToggleDarkMode,
  isOffline
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'add-expense', label: 'Add Expense', icon: Plus },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              BudgetSync
            </h1>
            {isOffline && (
              <div className="ml-3 flex items-center text-red-600 dark:text-red-400">
                <WifiOff className="w-4 h-4 mr-1" />
                <span className="text-sm">Offline</span>
              </div>
            )}
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={currentPage === item.id ? 'primary' : 'ghost'}
                size="sm"
                icon={item.icon}
                onClick={() => onPageChange(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              icon={darkMode ? Sun : Moon}
              onClick={onToggleDarkMode}
            />
            {!isOffline && (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <Wifi className="w-4 h-4 mr-1" />
                <span className="text-sm">Online</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      <div className="md:hidden bg-white border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={currentPage === item.id ? 'primary' : 'ghost'}
              size="sm"
              icon={item.icon}
              onClick={() => onPageChange(item.id)}
              className="flex flex-col items-center py-2 text-xs"
            >
              <item.icon className="w-5 h-5 mb-1" />
              {item.label}
            </Button>
          ))}
        </div>
      </div>
    </nav>
  );
};