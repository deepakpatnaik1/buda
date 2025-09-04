/**
 * Bus Schema Registry
 * Central registry for all bus event schemas and contracts
 */

import type { ThemeEventSchemas } from './theme.js';
import type { StateEventSchemas } from './state.js';
import type { ErrorEventSchemas } from './error.js';
import { themeEventContracts } from './theme.js';
import { stateEventContracts } from './state.js';
import { errorEventContracts } from './error.js';

// Combined event schemas for all buses
export type AllEventSchemas = ThemeEventSchemas & StateEventSchemas & ErrorEventSchemas;

// Combined event contracts
export const allEventContracts = {
  ...themeEventContracts,
  ...stateEventContracts,
  ...errorEventContracts
};

// Schema metadata for validation
export interface EventSchema {
  version: string;
  payload: any;
  description: string;
}

export interface EventContract {
  publishers: string[];
  subscribers: string[];
}

// Export individual schema modules
export * from './theme.js';
export * from './state.js';
export * from './error.js';
