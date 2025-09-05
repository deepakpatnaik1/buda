/**
 * BUDA Buses - 4-Bus Architecture
 * 
 * Exports all bus implementations following Rule #4: Decouple with Buses
 */

export { EventBus, eventBus, type EventBusConfig, type EventSubscription, type EventHandler, type EventMetadata } from './EventBus.js';
export { StateBus, stateBus, type StateBusConfig, type StateChangeHandler } from './StateBus.js';
export { ConfigBus, configBus, type ConfigBusConfig, type ConfigValue } from './ConfigBus.js';
export { ErrorBus, errorBus, type ErrorBusConfig, type ErrorContext, type ErrorHandler } from './ErrorBus.js';

/**
 * Initialize all buses with shared configuration
 */
export function initializeBuses(config: {
  enableLogging?: boolean;
  enableMetrics?: boolean;
  environment?: 'development' | 'production' | 'test';
}) {
  const isDev = config.environment === 'development';
  
  // Configure buses based on environment
  const busConfig = {
    enableLogging: config.enableLogging ?? isDev,
    enableMetrics: config.enableMetrics ?? true,
  };

  console.log('🚌 BUDA 4-Bus Architecture initialized:', {
    environment: config.environment || 'unknown',
    logging: busConfig.enableLogging,
    metrics: busConfig.enableMetrics
  });

  return {
    event: eventBus,
    state: stateBus, 
    config: configBus,
    error: errorBus
  };
}