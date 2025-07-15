export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  notes: string;
  synced: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  month: string; // YYYY-MM format
  spent: number;
  createdAt: string;
  updatedAt: string;
}

export interface SyncQueue {
  id: string;
  type: 'expense' | 'budget';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
}

export interface AppState {
  expenses: Expense[];
  budgets: Budget[];
  currentPage: 'dashboard' | 'add-expense' | 'history' | 'settings';
  darkMode: boolean;
  isOffline: boolean;
  syncQueue: SyncQueue[];
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}

export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Health & Fitness',
  'Travel',
  'Education',
  'Personal Care',
  'Others'
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];