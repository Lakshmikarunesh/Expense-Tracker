// Background Tasks API implementation
export class BackgroundTasksManager {
  private static instance: BackgroundTasksManager;
  private scheduler: any = null;

  private constructor() {
    // Check for Background Tasks API support
    this.scheduler = (navigator as any).scheduling || null;
  }

  static getInstance(): BackgroundTasksManager {
    if (!BackgroundTasksManager.instance) {
      BackgroundTasksManager.instance = new BackgroundTasksManager();
    }
    return BackgroundTasksManager.instance;
  }

  isSupported(): boolean {
    return this.scheduler !== null && typeof this.scheduler.postTask === 'function';
  }

  // Schedule a background task with priority
  async scheduleTask(
    task: () => Promise<void> | void,
    options: {
      priority?: 'user-blocking' | 'user-visible' | 'background';
      delay?: number;
      signal?: AbortSignal;
    } = {}
  ): Promise<void> {
    const {
      priority = 'background',
      delay = 0,
      signal
    } = options;

    if (this.isSupported()) {
      try {
        // Use Background Tasks API
        await this.scheduler.postTask(task, {
          priority,
          delay,
          signal
        });
      } catch (error) {
        console.warn('Background task failed:', error);
        // Fallback to setTimeout
        this.fallbackSchedule(task, delay);
      }
    } else {
      // Fallback for browsers without Background Tasks API
      this.fallbackSchedule(task, delay);
    }
  }

  private fallbackSchedule(task: () => Promise<void> | void, delay: number): void {
    if (delay > 0) {
      setTimeout(async () => {
        try {
          await task();
        } catch (error) {
          console.error('Background task error:', error);
        }
      }, delay);
    } else {
      // Use requestIdleCallback if available, otherwise setTimeout
      if ('requestIdleCallback' in window) {
        requestIdleCallback(async () => {
          try {
            await task();
          } catch (error) {
            console.error('Background task error:', error);
          }
        });
      } else {
        setTimeout(async () => {
          try {
            await task();
          } catch (error) {
            console.error('Background task error:', error);
          }
        }, 0);
      }
    }
  }

  // Schedule periodic background tasks
  schedulePeriodicTask(
    task: () => Promise<void> | void,
    interval: number,
    options: {
      priority?: 'user-blocking' | 'user-visible' | 'background';
      immediate?: boolean;
    } = {}
  ): () => void {
    const { priority = 'background', immediate = false } = options;
    let isRunning = true;

    const runTask = async () => {
      if (!isRunning) return;

      await this.scheduleTask(task, { priority });
      
      if (isRunning) {
        setTimeout(runTask, interval);
      }
    };

    if (immediate) {
      runTask();
    } else {
      setTimeout(runTask, interval);
    }

    // Return cleanup function
    return () => {
      isRunning = false;
    };
  }

  // Schedule budget reminder tasks
  scheduleBudgetReminders(): () => void {
    return this.schedulePeriodicTask(
      async () => {
        // Import here to avoid circular dependencies
        const { dbService } = await import('../services/indexedDB');
        const { backgroundSync } = await import('./backgroundSync');
        
        try {
          const budgets = await dbService.getAllBudgets();
          const currentMonth = new Date().toISOString().slice(0, 7);

          for (const budget of budgets) {
            if (budget.month === currentMonth) {
              const percentage = (budget.spent / budget.monthlyLimit) * 100;
              
              if (percentage >= 80) {
                // Schedule notification task
                await this.scheduleTask(
                  () => {
                    if ('Notification' in window && Notification.permission === 'granted') {
                      new Notification(`Budget Alert: ${budget.category}`, {
                        body: `You've spent ${percentage.toFixed(0)}% of your budget`,
                        icon: '/icon-192x192.png',
                        tag: `budget-${budget.id}`
                      });
                    }
                  },
                  { priority: 'user-visible' }
                );
              }
            }
          }
        } catch (error) {
          console.error('Budget reminder task failed:', error);
        }
      },
      30 * 60 * 1000, // Every 30 minutes
      { priority: 'background' }
    );
  }

  // Schedule data sync tasks
  scheduleDataSync(): () => void {
    return this.schedulePeriodicTask(
      async () => {
        const { syncService } = await import('../services/syncService');
        const { NetworkDetection } = await import('./networkDetection');
        
        const networkDetection = NetworkDetection.getInstance();
        
        if (networkDetection.isOnline() && !networkDetection.isSlowConnection()) {
          await syncService.syncQueuedExpenses();
        }
      },
      5 * 60 * 1000, // Every 5 minutes
      { priority: 'background' }
    );
  }

  // Schedule cleanup tasks
  scheduleCleanupTasks(): () => void {
    return this.schedulePeriodicTask(
      async () => {
        // Clean up old sync queue items, expired data, etc.
        console.log('Running cleanup tasks...');
        
        // Example: Clean up old notifications
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          if (registration.showNotification) {
            // Clean up old notifications (browser handles this mostly)
          }
        }
      },
      60 * 60 * 1000, // Every hour
      { priority: 'background' }
    );
  }
}