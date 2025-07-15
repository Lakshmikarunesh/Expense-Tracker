import { dbService } from '../services/indexedDB';
import { syncService } from '../services/syncService';
import { BackgroundTasksManager } from './backgroundTasks';

class BackgroundSync {
  private notificationPermission = false;
  private backgroundTasks = BackgroundTasksManager.getInstance();
  private cleanupTasks: (() => void)[] = [];

  constructor() {
    this.requestNotificationPermission();
    this.setupBackgroundSync();
    this.initializeBackgroundTasks();
  }

  private async requestNotificationPermission(): Promise<void> {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      this.notificationPermission = permission === 'granted';
    } else {
      this.notificationPermission = Notification.permission === 'granted';
    }
  }

  private setupBackgroundSync(): void {
    // Register background sync for expense synchronization
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        registration.sync.register('expense-sync');
      });
    }

    // Setup periodic budget checks using Background Tasks API
    this.initializeBackgroundTasks();
  }

  private initializeBackgroundTasks(): void {
    // Schedule budget reminders using Background Tasks API
    const budgetCleanup = this.backgroundTasks.scheduleBudgetReminders();
    this.cleanupTasks.push(budgetCleanup);

    // Schedule data sync tasks
    const syncCleanup = this.backgroundTasks.scheduleDataSync();
    this.cleanupTasks.push(syncCleanup);

    // Schedule cleanup tasks
    const cleanupCleanup = this.backgroundTasks.scheduleCleanupTasks();
    this.cleanupTasks.push(cleanupCleanup);

    // Fallback for browsers without Background Tasks API
    if (!this.backgroundTasks.isSupported()) {
      console.warn('Background Tasks API not supported, using fallback');
      this.setupFallbackTasks();
    }
  }

  private setupFallbackTasks(): void {
    // Fallback using setTimeout for budget reminders
    setInterval(async () => {
      await this.checkBudgetLimits();
    }, 30 * 60 * 1000);
  }

  private async checkBudgetLimits(): Promise<void> {
    try {
      const budgets = await dbService.getAllBudgets();
      const currentMonth = new Date().toISOString().slice(0, 7);

      for (const budget of budgets) {
        if (budget.month === currentMonth) {
          const percentage = (budget.spent / budget.monthlyLimit) * 100;
          
          if (percentage >= 80 && percentage < 100) {
            this.showBudgetNotification(
              `Budget Alert: ${budget.category}`,
              `You've spent ${percentage.toFixed(0)}% of your ${budget.category} budget this month.`
            );
          } else if (percentage >= 100) {
            this.showBudgetNotification(
              `Budget Exceeded: ${budget.category}`,
              `You've exceeded your ${budget.category} budget by $${(budget.spent - budget.monthlyLimit).toFixed(2)}.`
            );
          }
        }
      }
    } catch (error) {
      console.error('Error checking budget limits:', error);
    }
  }

  private showBudgetNotification(title: string, message: string): void {
    if (this.notificationPermission && 'Notification' in window) {
      new Notification(title, {
        body: message,
        icon: '/icon-192x192.png',
        tag: 'budget-alert'
      });
    }
  }

  async syncData(): Promise<void> {
    await syncService.syncQueuedExpenses();
  }

  // Cleanup method to stop all background tasks
  cleanup(): void {
    this.cleanupTasks.forEach(cleanup => cleanup());
    this.cleanupTasks = [];
  }
}

export const backgroundSync = new BackgroundSync();