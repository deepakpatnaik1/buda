/**
 * State Bus Event Schemas
 * Defines contracts for state-related bus communications
 */

export interface StateEventSchemas {
  // Dynamic state events (state:${key} pattern)
  'state:current-theme': {
    version: '1.0.0';
    payload: string; // theme name
    description: 'Current theme state change notification';
  };
}

// Publisher/Subscriber mapping for state events
export const stateEventContracts = {
  'state:current-theme': {
    publishers: ['StateBus.ts', 'ThemeWire.ts'],
    subscribers: ['ThemeWire.ts'] // via watchState
  }
};
