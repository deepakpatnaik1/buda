/**
 * BUDA StateBus - Rule #4 Bus Decoupling
 * 
 * Manages global application state through reactive patterns.
 * Provides type-safe state management with change notifications.
 */

export interface StateBusConfig {
  enablePersistence?: boolean;
  persistenceKey?: string;
  enableLogging?: boolean;
  enableMetrics?: boolean;
}

export interface StateChangeEvent<T = any> {
  key: string;
  oldValue: T;
  newValue: T;
  timestamp: Date;
  source?: string;
}

export type StateChangeHandler<T = any> = (event: StateChangeEvent<T>) => void;

export interface StateSubscription {
  unsubscribe(): void;
}

export interface StateMetrics {
  getCount: Map<string, number>;
  setCount: Map<string, number>;
  subscriptionCount: Map<string, number>;
  lastAccess: Map<string, Date>;
}

export class StateBus {
  private state = new Map<string, any>();
  private listeners = new Map<string, Set<StateChangeHandler>>();
  private config: Required<StateBusConfig>;
  private metrics: StateMetrics;

  constructor(config: StateBusConfig = {}) {
    this.config = {
      enablePersistence: config.enablePersistence ?? false,
      persistenceKey: config.persistenceKey ?? 'buda-state',
      enableLogging: config.enableLogging ?? false,
      enableMetrics: config.enableMetrics ?? true
    };

    this.metrics = {
      getCount: new Map(),
      setCount: new Map(),
      subscriptionCount: new Map(),
      lastAccess: new Map()
    };

    // Load persisted state if enabled
    if (this.config.enablePersistence && typeof localStorage !== 'undefined') {
      this.loadPersistedState();
    }
  }

  /**
   * Get state value by key
   * Rule #9: Instrument everything - track access metrics
   */
  get<T>(key: string): T | undefined {
    const value = this.state.get(key);

    if (this.config.enableMetrics) {
      const currentCount = this.metrics.getCount.get(key) || 0;
      this.metrics.getCount.set(key, currentCount + 1);
      this.metrics.lastAccess.set(key, new Date());
    }

    if (this.config.enableLogging) {
      console.log(`🗄️  StateBus: Get "${key}" = ${JSON.stringify(value)}`);
    }

    return value;
  }

  /**
   * Set state value and notify subscribers
   * Rule #9: No silent failures - always notify on changes
   */
  set<T>(key: string, value: T, source?: string): void {
    const oldValue = this.state.get(key);
    this.state.set(key, value);

    // Update metrics
    if (this.config.enableMetrics) {
      const currentCount = this.metrics.setCount.get(key) || 0;
      this.metrics.setCount.set(key, currentCount + 1);
      this.metrics.lastAccess.set(key, new Date());
    }

    if (this.config.enableLogging) {
      console.log(`🗄️  StateBus: Set "${key}" = ${JSON.stringify(value)} (was: ${JSON.stringify(oldValue)})`);
    }

    // Notify subscribers
    const changeEvent: StateChangeEvent<T> = {
      key,
      oldValue,
      newValue: value,
      timestamp: new Date(),
      source
    };

    this.notifySubscribers(key, changeEvent);

    // Persist state if enabled
    if (this.config.enablePersistence) {
      this.persistState();
    }
  }

  /**
   * Subscribe to state changes for specific key
   */
  subscribe<T>(key: string, handler: StateChangeHandler<T>): StateSubscription {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
      this.metrics.subscriptionCount.set(key, 0);
    }

    const keyListeners = this.listeners.get(key)!;
    keyListeners.add(handler);
    this.metrics.subscriptionCount.set(key, keyListeners.size);

    if (this.config.enableLogging) {
      console.log(`🗄️  StateBus: Subscribed to "${key}" (${keyListeners.size} listeners)`);
    }

    return {
      unsubscribe: () => {
        keyListeners.delete(handler);
        this.metrics.subscriptionCount.set(key, keyListeners.size);
        
        if (keyListeners.size === 0) {
          this.listeners.delete(key);
          this.metrics.subscriptionCount.delete(key);
        }

        if (this.config.enableLogging) {
          console.log(`🗄️  StateBus: Unsubscribed from "${key}" (${keyListeners.size} listeners)`);
        }
      }
    };
  }

  /**
   * Check if key exists in state
   */
  has(key: string): boolean {
    return this.state.has(key);
  }

  /**
   * Delete key from state
   */
  delete(key: string): boolean {
    const existed = this.state.delete(key);
    
    if (existed) {
      // Notify subscribers of deletion
      const changeEvent: StateChangeEvent = {
        key,
        oldValue: this.state.get(key),
        newValue: undefined,
        timestamp: new Date(),
        source: 'StateBus.delete'
      };

      this.notifySubscribers(key, changeEvent);

      if (this.config.enableLogging) {
        console.log(`🗄️  StateBus: Deleted "${key}"`);
      }

      // Update persistence
      if (this.config.enablePersistence) {
        this.persistState();
      }
    }

    return existed;
  }

  /**
   * Clear all state
   */
  clear(): void {
    const keys = Array.from(this.state.keys());
    this.state.clear();

    // Notify all subscribers
    keys.forEach(key => {
      const changeEvent: StateChangeEvent = {
        key,
        oldValue: undefined,
        newValue: undefined,
        timestamp: new Date(),
        source: 'StateBus.clear'
      };
      
      this.notifySubscribers(key, changeEvent);
    });

    if (this.config.enableLogging) {
      console.log('🗄️  StateBus: All state cleared');
    }

    // Clear persistence
    if (this.config.enablePersistence && typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.config.persistenceKey);
    }
  }

  /**
   * Get all state keys
   */
  keys(): string[] {
    return Array.from(this.state.keys());
  }

  /**
   * Get current metrics
   */
  getMetrics(): Readonly<StateMetrics> {
    return {
      getCount: new Map(this.metrics.getCount),
      setCount: new Map(this.metrics.setCount),
      subscriptionCount: new Map(this.metrics.subscriptionCount),
      lastAccess: new Map(this.metrics.lastAccess)
    };
  }

  /**
   * Notify subscribers of state changes
   */
  private notifySubscribers<T>(key: string, event: StateChangeEvent<T>): void {
    const listeners = this.listeners.get(key);
    if (!listeners || listeners.size === 0) return;

    listeners.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        // Rule #9: No silent failures
        console.error(`🗄️  StateBus: Handler error for key "${key}":`, error);
      }
    });
  }

  /**
   * Load state from localStorage
   */
  private loadPersistedState(): void {
    try {
      const persistedState = localStorage.getItem(this.config.persistenceKey);
      if (persistedState) {
        const parsed = JSON.parse(persistedState);
        Object.entries(parsed).forEach(([key, value]) => {
          this.state.set(key, value);
        });

        if (this.config.enableLogging) {
          console.log(`🗄️  StateBus: Loaded ${Object.keys(parsed).length} keys from persistence`);
        }
      }
    } catch (error) {
      console.error('🗄️  StateBus: Failed to load persisted state:', error);
    }
  }

  /**
   * Save state to localStorage
   */
  private persistState(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const stateObject = Object.fromEntries(this.state.entries());
      localStorage.setItem(this.config.persistenceKey, JSON.stringify(stateObject));
    } catch (error) {
      console.error('🗄️  StateBus: Failed to persist state:', error);
    }
  }
}

// Default singleton instance
export const stateBus = new StateBus({
  enableLogging: process.env.NODE_ENV === 'development',
  enableMetrics: true,
  enablePersistence: typeof localStorage !== 'undefined'
});