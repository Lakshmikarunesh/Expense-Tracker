export class NetworkDetection {
  private static instance: NetworkDetection;
  private callbacks: ((isOnline: boolean) => void)[] = [];
  private connection: any = null;

  private constructor() {
    // Initialize Network Information API
    this.connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;
    this.setupListeners();
  }

  static getInstance(): NetworkDetection {
    if (!NetworkDetection.instance) {
      NetworkDetection.instance = new NetworkDetection();
    }
    return NetworkDetection.instance;
  }

  private setupListeners(): void {
    window.addEventListener('online', () => {
      this.notifyCallbacks(true);
    });

    window.addEventListener('offline', () => {
      this.notifyCallbacks(false);
    });

    // Network Information API listeners
    if (this.connection) {
      this.connection.addEventListener('change', () => {
        this.notifyCallbacks(navigator.onLine);
        this.handleConnectionChange();
      });
    }
  }

  private handleConnectionChange(): void {
    if (this.connection) {
      console.log('Network changed:', {
        effectiveType: this.connection.effectiveType,
        downlink: this.connection.downlink,
        rtt: this.connection.rtt,
        saveData: this.connection.saveData
      });
      
      // Notify about slow connections
      if (this.connection.effectiveType === 'slow-2g' || this.connection.effectiveType === '2g') {
        this.notifySlowConnection();
      }
    }
  }

  private notifySlowConnection(): void {
    this.callbacks.forEach(callback => {
      // You can extend this to pass connection info
      if (typeof callback === 'function') {
        this.notifyCallbacks(navigator.onLine);
      }
    });
  }

  private notifyCallbacks(isOnline: boolean): void {
    this.callbacks.forEach(callback => callback(isOnline));
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  getConnectionInfo(): any {
    if (this.connection) {
      return {
        effectiveType: this.connection.effectiveType,
        downlink: this.connection.downlink,
        rtt: this.connection.rtt,
        saveData: this.connection.saveData,
        type: this.connection.type
      };
    }
    return null;
  }

  isSlowConnection(): boolean {
    if (this.connection) {
      return this.connection.effectiveType === 'slow-2g' || 
             this.connection.effectiveType === '2g';
    }
    return false;
  }

  getEstimatedBandwidth(): number {
    return this.connection?.downlink || 0;
  }

  getRoundTripTime(): number {
    return this.connection?.rtt || 0;
  }

  onNetworkChange(callback: (isOnline: boolean) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }
}