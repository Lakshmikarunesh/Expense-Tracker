import React, { useState, useEffect } from 'react';
import { Expense, Budget, AppState } from './types';
import { dbService } from './services/indexedDB';
import { syncService } from './services/syncService';
import { NetworkDetection } from './utils/networkDetection';
import { backgroundSync } from './utils/backgroundSync';
import { BackgroundTasksManager } from './utils/backgroundTasks';
import { Navigation } from './components/Layout/Navigation';
import { Dashboard } from './components/Dashboard';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseHistory } from './components/ExpenseHistory';
import { BudgetSettings } from './components/BudgetSettings';

export default function App() {
  const [appState, setAppState] = useState<AppState>({
    expenses: [],
    budgets: [],
    currentPage: 'dashboard',
    darkMode: false,
    isOffline: false,
    syncQueue: []
  });

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize IndexedDB
      await dbService.init();

      // Load data from IndexedDB
      const [expenses, budgets, syncQueue] = await Promise.all([
        dbService.getAllExpenses(),
        dbService.getAllBudgets(),
        dbService.getSyncQueue()
      ]);

      // Set up network detection
      const networkDetection = NetworkDetection.getInstance();
      const isOffline = !networkDetection.isOnline();
      
      // Log network information
      const connectionInfo = networkDetection.getConnectionInfo();
      if (connectionInfo) {
        console.log('Network Information:', connectionInfo);
      }

      // Set up dark mode preference
      const savedDarkMode = localStorage.getItem('darkMode') === 'true';
      if (savedDarkMode) {
        document.documentElement.classList.add('dark');
      }

      setAppState(prev => ({
        ...prev,
        expenses,
        budgets,
        syncQueue,
        isOffline,
        darkMode: savedDarkMode
      }));

      // Set up network change listener
      networkDetection.onNetworkChange((isOnline) => {
        setAppState(prev => ({ ...prev, isOffline: !isOnline }));
        
        // Log connection changes
        const connectionInfo = networkDetection.getConnectionInfo();
        console.log('Network status changed:', { isOnline, connectionInfo });
      });

      // Initialize Background Tasks API
      const backgroundTasksManager = BackgroundTasksManager.getInstance();
      console.log('Background Tasks API supported:', backgroundTasksManager.isSupported());

      // Register service worker for PWA
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js');
      }

    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: string) => {
    setAppState(prev => ({ ...prev, currentPage: page as any }));
    setEditingExpense(null);
  };

  const handleToggleDarkMode = () => {
    const newDarkMode = !appState.darkMode;
    setAppState(prev => ({ ...prev, darkMode: newDarkMode }));
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSaveExpense = async (expense: Expense) => {
    try {
      const isUpdate = appState.expenses.some(e => e.id === expense.id);
      
      if (isUpdate) {
        await dbService.updateExpense(expense);
      } else {
        await dbService.addExpense(expense);
      }

      // Queue for sync
      await syncService.queueForSync({
        type: 'expense',
        action: isUpdate ? 'update' : 'create',
        data: expense
      });

      // Update local state
      setAppState(prev => ({
        ...prev,
        expenses: isUpdate 
          ? prev.expenses.map(e => e.id === expense.id ? expense : e)
          : [...prev.expenses, expense],
        currentPage: 'dashboard'
      }));

      setEditingExpense(null);
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await dbService.deleteExpense(id);
      
      // Queue for sync
      await syncService.queueForSync({
        type: 'expense',
        action: 'delete',
        data: { id }
      });

      // Update local state
      setAppState(prev => ({
        ...prev,
        expenses: prev.expenses.filter(e => e.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const handleSaveBudget = async (budget: Budget) => {
    try {
      const isUpdate = appState.budgets.some(b => b.id === budget.id);
      
      if (isUpdate) {
        await dbService.updateBudget(budget);
      } else {
        await dbService.addBudget(budget);
      }

      // Queue for sync
      await syncService.queueForSync({
        type: 'budget',
        action: isUpdate ? 'update' : 'create',
        data: budget
      });

      // Update local state
      setAppState(prev => ({
        ...prev,
        budgets: isUpdate 
          ? prev.budgets.map(b => b.id === budget.id ? budget : b)
          : [...prev.budgets, budget]
      }));
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      // Delete from database
      await dbService.deleteBudget(id);
      
      // Queue for sync
      await syncService.queueForSync({
        type: 'budget',
        action: 'delete',
        data: { id }
      });

      // Update local state
      setAppState(prev => ({
        ...prev,
        budgets: prev.budgets.filter(b => b.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setAppState(prev => ({ ...prev, currentPage: 'add-expense' }));
  };

  const handleCancelExpenseForm = () => {
    setEditingExpense(null);
    setAppState(prev => ({ ...prev, currentPage: 'dashboard' }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading BudgetSync...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${appState.darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
        <Navigation
          currentPage={appState.currentPage}
          onPageChange={handlePageChange}
          darkMode={appState.darkMode}
          onToggleDarkMode={handleToggleDarkMode}
          isOffline={appState.isOffline}
        />

        <main className="py-6">
          {appState.currentPage === 'dashboard' && (
            <Dashboard
              expenses={appState.expenses}
              budgets={appState.budgets}
            />
          )}

          {appState.currentPage === 'add-expense' && (
            <ExpenseForm
              expense={editingExpense}
              onSave={handleSaveExpense}
              onCancel={handleCancelExpenseForm}
            />
          )}

          {appState.currentPage === 'history' && (
            <ExpenseHistory
              expenses={appState.expenses}
              onEditExpense={handleEditExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {appState.currentPage === 'settings' && (
            <BudgetSettings
              budgets={appState.budgets}
              onSaveBudget={handleSaveBudget}
              onDeleteBudget={handleDeleteBudget}
              expenses={appState.expenses}
            />
          )}
        </main>
      </div>
    </div>
  );
}