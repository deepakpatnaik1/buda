/**
 * Error Bus Event Schemas
 * Defines contracts for error-related bus communications
 */

export interface ErrorEventSchemas {
  'error': {
    version: '1.0.0';
    payload: {
      error: Error | string;
      context?: string;
      timestamp: number;
    };
    description: 'Error reporting event';
  };
}

// Publisher/Subscriber mapping for error events
export const errorEventContracts = {
  'error': {
    publishers: ['ErrorBus.ts'],
    subscribers: [] // Can be subscribed to by any error handlers
  }
};
