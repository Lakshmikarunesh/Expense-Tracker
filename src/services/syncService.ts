import { dbService } from './indexedDB';
import { SyncQueue } from '../types';

class SyncService {
  private isOnline = navigator.onLine;
  private syncInProgress = false;

  constructor() {
    this.setupNetworkListeners();
  }

  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncQueuedExpenses();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async syncQueuedExpenses(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;

    try {
      const syncQueue = await dbService.getSyncQueue();
      
      for (const item of syncQueue) {
        await this.processSyncItem(item);
      }

      await dbService.clearSyncQueue();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processSyncItem(item: SyncQueue): Promise<void> {
    // In a real app, this would sync with a backend server
    // For demo purposes, we'll just simulate the sync process
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Synced ${item.type} ${item.action}:`, item.data);
        resolve();
      }, 100);
    });
  }

  async queueForSync(item: Omit<SyncQueue, 'id' | 'timestamp'>): Promise<void> {
    const syncItem: SyncQueue = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    await dbService.addToSyncQueue(syncItem);

    if (this.isOnline) {
      this.syncQueuedExpenses();
    }
  }

  getNetworkStatus(): boolean {
    return this.isOnline;
  }
}

export const syncService = new SyncService();