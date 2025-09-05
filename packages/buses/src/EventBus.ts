/**
 * BUDA EventBus - Rule #4 Bus Decoupling
 * 
 * Manages inter-component communication through pub/sub pattern.
 * Prevents tight coupling between LEGO components.
 */

export interface EventBusConfig {
  maxListeners?: number;
  enableLogging?: boolean;
  enableMetrics?: boolean;
}

export interface EventSubscription {
  unsubscribe(): void;
}

export interface EventMetrics {
  eventCounts: Map<string, number>;
  lastEmitted: Map<string, Date>;
  subscriptionCounts: Map<string, number>;
}

export type EventHandler<T = any> = (data: T, meta: EventMetadata) => void | Promise<void>;

export interface EventMetadata {
  timestamp: Date;
  source?: string;
  trace?: string;
  version?: string;
}

export class EventBus {
  private listeners = new Map<string, Set<EventHandler>>();
  private config: Required<EventBusConfig>;
  private metrics: EventMetrics;

  constructor(config: EventBusConfig = {}) {
    this.config = {
      maxListeners: config.maxListeners ?? 100,
      enableLogging: config.enableLogging ?? false,
      enableMetrics: config.enableMetrics ?? true
    };

    this.metrics = {
      eventCounts: new Map(),
      lastEmitted: new Map(), 
      subscriptionCounts: new Map()
    };
  }

  /**
   * Subscribe to an event
   * Rule #4: Components communicate only through buses
   */
  subscribe<T>(event: string, handler: EventHandler<T>): EventSubscription {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
      this.metrics.subscriptionCounts.set(event, 0);
    }

    const eventSet = this.listeners.get(event)!;
    
    // Rule #7: No hardcoding - check max listeners from config
    if (eventSet.size >= this.config.maxListeners) {
      throw new Error(`Maximum listeners (${this.config.maxListeners}) exceeded for event: ${event}`);
    }

    eventSet.add(handler);
    this.metrics.subscriptionCounts.set(event, eventSet.size);

    if (this.config.enableLogging) {
      console.log(`📡 EventBus: Subscribed to "${event}" (${eventSet.size} listeners)`);
    }

    return {
      unsubscribe: () => {
        eventSet.delete(handler);
        this.metrics.subscriptionCounts.set(event, eventSet.size);
        
        if (eventSet.size === 0) {
          this.listeners.delete(event);
          this.metrics.subscriptionCounts.delete(event);
        }

        if (this.config.enableLogging) {
          console.log(`📡 EventBus: Unsubscribed from "${event}" (${eventSet.size} listeners)`);
        }
      }
    };
  }

  /**
   * Publish an event to all subscribers
   * Rule #9: Instrument everything - includes metadata and metrics
   */
  async publish<T>(event: string, data: T, source?: string): Promise<void> {
    const metadata: EventMetadata = {
      timestamp: new Date(),
      source,
      trace: this.generateTrace(),
      version: '1.0'
    };

    // Update metrics
    if (this.config.enableMetrics) {
      const currentCount = this.metrics.eventCounts.get(event) || 0;
      this.metrics.eventCounts.set(event, currentCount + 1);
      this.metrics.lastEmitted.set(event, metadata.timestamp);
    }

    if (this.config.enableLogging) {
      console.log(`📡 EventBus: Publishing "${event}" from ${source || 'unknown'}`);
    }

    const listeners = this.listeners.get(event);
    if (!listeners || listeners.size === 0) {
      if (this.config.enableLogging) {
        console.warn(`📡 EventBus: No listeners for event "${event}"`);
      }
      return;
    }

    // Execute all handlers (async support)
    const promises = Array.from(listeners).map(async (handler) => {
      try {
        await handler(data, metadata);
      } catch (error) {
        // Rule #9: No silent failures - always log errors
        console.error(`📡 EventBus: Handler error for "${event}":`, error);
        
        // Emit error to ErrorBus if available
        if (event !== 'system.error') {
          this.publish('system.error', {
            source: 'EventBus',
            originalEvent: event,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date()
          }, 'EventBus');
        }
      }
    });

    await Promise.all(promises);
  }

  /**
   * Get current metrics - Rule #9 instrumentation
   */
  getMetrics(): Readonly<EventMetrics> {
    return {
      eventCounts: new Map(this.metrics.eventCounts),
      lastEmitted: new Map(this.metrics.lastEmitted),
      subscriptionCounts: new Map(this.metrics.subscriptionCounts)
    };
  }

  /**
   * Clear all listeners - useful for testing and cleanup
   */
  clear(): void {
    this.listeners.clear();
    this.metrics.eventCounts.clear();
    this.metrics.lastEmitted.clear();
    this.metrics.subscriptionCounts.clear();

    if (this.config.enableLogging) {
      console.log('📡 EventBus: All listeners cleared');
    }
  }

  /**
   * Get list of active events
   */
  getActiveEvents(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Generate trace ID for request correlation
   */
  private generateTrace(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Default singleton instance
export const eventBus = new EventBus({
  enableLogging: process.env.NODE_ENV === 'development',
  enableMetrics: true,
  maxListeners: parseInt(process.env.BUDA_MAX_EVENT_LISTENERS || '100')
});