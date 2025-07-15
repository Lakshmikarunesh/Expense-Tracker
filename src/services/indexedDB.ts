import { Expense, Budget, SyncQueue } from '../types';

const DB_NAME = 'BudgetSyncDB';
const DB_VERSION = 1;
const EXPENSES_STORE = 'expenses';
const BUDGETS_STORE = 'budgets';
const SYNC_QUEUE_STORE = 'syncQueue';

class IndexedDBService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create expenses store
        if (!db.objectStoreNames.contains(EXPENSES_STORE)) {
          const expenseStore = db.createObjectStore(EXPENSES_STORE, { keyPath: 'id' });
          expenseStore.createIndex('category', 'category', { unique: false });
          expenseStore.createIndex('date', 'date', { unique: false });
          expenseStore.createIndex('synced', 'synced', { unique: false });
        }

        // Create budgets store
        if (!db.objectStoreNames.contains(BUDGETS_STORE)) {
          const budgetStore = db.createObjectStore(BUDGETS_STORE, { keyPath: 'id' });
          budgetStore.createIndex('category', 'category', { unique: false });
          budgetStore.createIndex('month', 'month', { unique: false });
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
          db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id' });
        }
      };
    });
  }

  // Expense operations
  async addExpense(expense: Expense): Promise<void> {
    const transaction = this.db!.transaction([EXPENSES_STORE], 'readwrite');
    const store = transaction.objectStore(EXPENSES_STORE);
    return new Promise((resolve, reject) => {
      const request = store.add(expense);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateExpense(expense: Expense): Promise<void> {
    const transaction = this.db!.transaction([EXPENSES_STORE], 'readwrite');
    const store = transaction.objectStore(EXPENSES_STORE);
    return new Promise((resolve, reject) => {
      const request = store.put(expense);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteExpense(id: string): Promise<void> {
    const transaction = this.db!.transaction([EXPENSES_STORE], 'readwrite');
    const store = transaction.objectStore(EXPENSES_STORE);
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllExpenses(): Promise<Expense[]> {
    const transaction = this.db!.transaction([EXPENSES_STORE], 'readonly');
    const store = transaction.objectStore(EXPENSES_STORE);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getExpensesByCategory(category: string): Promise<Expense[]> {
    const transaction = this.db!.transaction([EXPENSES_STORE], 'readonly');
    const store = transaction.objectStore(EXPENSES_STORE);
    const index = store.index('category');
    return new Promise((resolve, reject) => {
      const request = index.getAll(category);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    const transaction = this.db!.transaction([EXPENSES_STORE], 'readonly');
    const store = transaction.objectStore(EXPENSES_STORE);
    const index = store.index('date');
    return new Promise((resolve, reject) => {
      const request = index.getAll(IDBKeyRange.bound(startDate, endDate));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Budget operations
  async addBudget(budget: Budget): Promise<void> {
    const transaction = this.db!.transaction([BUDGETS_STORE], 'readwrite');
    const store = transaction.objectStore(BUDGETS_STORE);
    return new Promise((resolve, reject) => {
      const request = store.add(budget);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateBudget(budget: Budget): Promise<void> {
    const transaction = this.db!.transaction([BUDGETS_STORE], 'readwrite');
    const store = transaction.objectStore(BUDGETS_STORE);
    return new Promise((resolve, reject) => {
      const request = store.put(budget);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteBudget(id: string): Promise<void> {
    const transaction = this.db!.transaction([BUDGETS_STORE], 'readwrite');
    const store = transaction.objectStore(BUDGETS_STORE);
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  async getAllBudgets(): Promise<Budget[]> {
    const transaction = this.db!.transaction([BUDGETS_STORE], 'readonly');
    const store = transaction.objectStore(BUDGETS_STORE);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getBudgetByCategory(category: string, month: string): Promise<Budget | null> {
    const transaction = this.db!.transaction([BUDGETS_STORE], 'readonly');
    const store = transaction.objectStore(BUDGETS_STORE);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const budgets = request.result;
        const budget = budgets.find(b => b.category === category && b.month === month);
        resolve(budget || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Sync queue operations
  async addToSyncQueue(item: SyncQueue): Promise<void> {
    const transaction = this.db!.transaction([SYNC_QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(SYNC_QUEUE_STORE);
    return new Promise((resolve, reject) => {
      const request = store.add(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue(): Promise<SyncQueue[]> {
    const transaction = this.db!.transaction([SYNC_QUEUE_STORE], 'readonly');
    const store = transaction.objectStore(SYNC_QUEUE_STORE);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearSyncQueue(): Promise<void> {
    const transaction = this.db!.transaction([SYNC_QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(SYNC_QUEUE_STORE);
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const dbService = new IndexedDBService();