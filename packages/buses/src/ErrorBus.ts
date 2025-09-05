/**
 * BUDA ErrorBus - Rule #9 Instrument Everything
 * 
 * Centralized error handling, logging, and monitoring.
 * Prevents silent failures and provides comprehensive error tracking.
 */

export interface ErrorContext {
  source?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface ErrorEvent {
  id: string;
  error: Error;
  context: ErrorContext;
  timestamp: Date;
  level: 'error' | 'warn' | 'fatal';
  handled: boolean;
}

export type ErrorHandler = (event: ErrorEvent) => void | Promise<void>;

export interface ErrorBusConfig {
  enableLogging?: boolean;
  enableMetrics?: boolean;
  maxErrorHistory?: number;
  enableStackTrace?: boolean;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByLevel: Map<string, number>;
  errorsBySource: Map<string, number>;
  recentErrors: ErrorEvent[];
  handlerCount: number;
}

export class ErrorBus {
  private handlers = new Set<ErrorHandler>();
  private errorHistory: ErrorEvent[] = [];
  private config: Required<ErrorBusConfig>;
  private metrics: ErrorMetrics;

  constructor(config: ErrorBusConfig = {}) {
    this.config = {
      enableLogging: config.enableLogging ?? true,
      enableMetrics: config.enableMetrics ?? true,
      maxErrorHistory: config.maxErrorHistory ?? 100,
      enableStackTrace: config.enableStackTrace ?? true
    };

    this.metrics = {
      totalErrors: 0,
      errorsByLevel: new Map(),
      errorsBySource: new Map(),
      recentErrors: [],
      handlerCount: 0
    };

    // Set up global error handlers
    this.setupGlobalHandlers();
  }

  /**
   * Capture and process an error
   * Rule #9: No silent failures - all errors are captured and logged
   */
  capture(error: Error | string, context: ErrorContext = {}, level: 'error' | 'warn' | 'fatal' = 'error'): void {
    // Normalize error to Error object
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    // Create error event
    const errorEvent: ErrorEvent = {
      id: this.generateErrorId(),
      error: errorObj,
      context: {
        timestamp: new Date(),
        ...context
      },
      timestamp: new Date(),
      level,
      handled: false
    };

    // Update metrics
    if (this.config.enableMetrics) {
      this.updateMetrics(errorEvent);
    }

    // Log error if enabled
    if (this.config.enableLogging) {
      this.logError(errorEvent);
    }

    // Store in history
    this.addToHistory(errorEvent);

    // Notify all handlers
    this.notifyHandlers(errorEvent);

    // Mark as handled
    errorEvent.handled = true;
  }

  /**
   * Capture error with promise rejection handling
   */
  async captureAsync(error: Error | string, context: ErrorContext = {}, level: 'error' | 'warn' | 'fatal' = 'error'): Promise<void> {
    this.capture(error, context, level);
  }

  /**
   * Register error handler
   */
  addHandler(handler: ErrorHandler): () => void {
    this.handlers.add(handler);
    this.metrics.handlerCount = this.handlers.size;

    if (this.config.enableLogging) {
      console.log(`🚨 ErrorBus: Handler registered (${this.handlers.size} total)`);
    }

    // Return unsubscribe function
    return () => {
      this.handlers.delete(handler);
      this.metrics.handlerCount = this.handlers.size;
      
      if (this.config.enableLogging) {
        console.log(`🚨 ErrorBus: Handler removed (${this.handlers.size} total)`);
      }
    };
  }

  /**
   * Get error metrics
   */
  getMetrics(): Readonly<ErrorMetrics> {
    return {
      totalErrors: this.metrics.totalErrors,
      errorsByLevel: new Map(this.metrics.errorsByLevel),
      errorsBySource: new Map(this.metrics.errorsBySource),
      recentErrors: [...this.metrics.recentErrors],
      handlerCount: this.metrics.handlerCount
    };
  }

  /**
   * Get recent error history
   */
  getRecentErrors(limit: number = 10): ErrorEvent[] {
    return this.errorHistory.slice(-limit);
  }

  /**
   * Clear error history
   */
  clearHistory(): void {
    this.errorHistory = [];
    this.metrics.recentErrors = [];
    
    if (this.config.enableLogging) {
      console.log('🚨 ErrorBus: Error history cleared');
    }
  }

  /**
   * Create error boundary wrapper for functions
   */
  wrap<T extends (...args: any[]) => any>(fn: T, context: ErrorContext = {}): T {
    return ((...args: any[]) => {
      try {
        const result = fn(...args);
        
        // Handle promises
        if (result && typeof result.catch === 'function') {
          return result.catch((error: Error) => {
            this.capture(error, { ...context, source: fn.name || 'wrapped-function' });
            throw error; // Re-throw to maintain promise chain
          });
        }
        
        return result;
      } catch (error) {
        this.capture(error as Error, { ...context, source: fn.name || 'wrapped-function' });
        throw error; // Re-throw to maintain normal error flow
      }
    }) as T;
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalHandlers(): void {
    // Browser environment
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.capture(event.error || new Error(event.message), {
          source: 'window.error',
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.capture(
          event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
          { source: 'unhandled-promise-rejection' },
          'fatal'
        );
      });
    }

    // Node.js environment
    if (typeof process !== 'undefined') {
      process.on('uncaughtException', (error) => {
        this.capture(error, { source: 'uncaught-exception' }, 'fatal');
      });

      process.on('unhandledRejection', (reason, promise) => {
        this.capture(
          reason instanceof Error ? reason : new Error(String(reason)),
          { source: 'unhandled-promise-rejection', metadata: { promise } },
          'fatal'
        );
      });
    }
  }

  /**
   * Update error metrics
   */
  private updateMetrics(errorEvent: ErrorEvent): void {
    this.metrics.totalErrors++;

    // Update level metrics
    const levelCount = this.metrics.errorsByLevel.get(errorEvent.level) || 0;
    this.metrics.errorsByLevel.set(errorEvent.level, levelCount + 1);

    // Update source metrics
    const source = errorEvent.context.source || 'unknown';
    const sourceCount = this.metrics.errorsBySource.get(source) || 0;
    this.metrics.errorsBySource.set(source, sourceCount + 1);

    // Update recent errors
    this.metrics.recentErrors.push(errorEvent);
    if (this.metrics.recentErrors.length > 10) {
      this.metrics.recentErrors.shift();
    }
  }

  /**
   * Log error with formatting
   */
  private logError(errorEvent: ErrorEvent): void {
    const prefix = this.getLogPrefix(errorEvent.level);
    const context = errorEvent.context;
    
    console.group(`${prefix} ErrorBus: ${errorEvent.error.message}`);
    console.log('📍 Source:', context.source || 'unknown');
    console.log('🕐 Time:', errorEvent.timestamp.toISOString());
    console.log('📋 Level:', errorEvent.level);
    console.log('🆔 ID:', errorEvent.id);
    
    if (context.metadata && Object.keys(context.metadata).length > 0) {
      console.log('📄 Metadata:', context.metadata);
    }

    if (this.config.enableStackTrace && errorEvent.error.stack) {
      console.log('📚 Stack:', errorEvent.error.stack);
    }
    
    console.groupEnd();
  }

  /**
   * Add error to history with size management
   */
  private addToHistory(errorEvent: ErrorEvent): void {
    this.errorHistory.push(errorEvent);
    
    // Maintain history size limit
    if (this.errorHistory.length > this.config.maxErrorHistory) {
      this.errorHistory.shift();
    }
  }

  /**
   * Notify all registered handlers
   */
  private notifyHandlers(errorEvent: ErrorEvent): void {
    this.handlers.forEach(async (handler) => {
      try {
        await handler(errorEvent);
      } catch (handlerError) {
        // Prevent infinite loops - don't capture handler errors through the bus
        console.error('🚨 ErrorBus: Handler error:', handlerError);
      }
    });
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get log prefix for error level
   */
  private getLogPrefix(level: string): string {
    switch (level) {
      case 'warn': return '⚠️';
      case 'fatal': return '💀';
      default: return '🚨';
    }
  }
}

// Default singleton instance
export const errorBus = new ErrorBus({
  enableLogging: true,
  enableMetrics: true,
  enableStackTrace: process.env.NODE_ENV !== 'production'
});