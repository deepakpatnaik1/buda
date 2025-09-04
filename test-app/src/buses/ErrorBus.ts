/**
 * ErrorBus - Thin wrapper over console.error
 * Rule 3: Thin Wrappers - Just error reporting, nothing else
 */
import { eventBus } from './EventBus.js';

export const errorBus = {
  reportError(error: Error | string, context?: string): void {
    console.error('[ErrorBus]', error, context);
    eventBus.publish('error', { error, context, timestamp: Date.now() });
  },

  subscribe(handler: (data: { error: Error | string; context?: string; timestamp: number }) => void): () => void {
    return eventBus.subscribe('error', handler);
  }
};