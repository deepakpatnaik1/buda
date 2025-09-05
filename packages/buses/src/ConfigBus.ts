/**
 * BUDA ConfigBus - Rule #7 No Hardcoding
 * 
 * Manages application configuration through environment variables,
 * config files, and runtime settings. Prevents hardcoded values.
 */

export type ConfigValue = string | number | boolean | object | null;

export interface ConfigBusConfig {
  enableLogging?: boolean;
  enableMetrics?: boolean;
  enableValidation?: boolean;
  defaultValues?: Record<string, ConfigValue>;
}

export interface ConfigMetrics {
  getCount: Map<string, number>;
  setCount: Map<string, number>;
  lastAccess: Map<string, Date>;
  validationErrors: number;
}

export class ConfigBus {
  private config = new Map<string, ConfigValue>();
  private configOptions: Required<ConfigBusConfig>;
  private metrics: ConfigMetrics;

  constructor(config: ConfigBusConfig = {}) {
    this.configOptions = {
      enableLogging: config.enableLogging ?? false,
      enableMetrics: config.enableMetrics ?? true,
      enableValidation: config.enableValidation ?? true,
      defaultValues: config.defaultValues ?? {}
    };

    this.metrics = {
      getCount: new Map(),
      setCount: new Map(),
      lastAccess: new Map(),
      validationErrors: 0
    };

    // Initialize with default values
    Object.entries(this.configOptions.defaultValues).forEach(([key, value]) => {
      this.config.set(key, value);
    });

    // Load environment variables
    this.loadEnvironmentVariables();
  }

  /**
   * Get configuration value by key
   * Supports dot notation for nested objects (e.g., 'api.baseUrl')
   */
  get<T extends ConfigValue>(key: string): T | undefined {
    // Update metrics
    if (this.configOptions.enableMetrics) {
      const currentCount = this.metrics.getCount.get(key) || 0;
      this.metrics.getCount.set(key, currentCount + 1);
      this.metrics.lastAccess.set(key, new Date());
    }

    // Support dot notation
    if (key.includes('.')) {
      return this.getNestedValue(key) as T;
    }

    const value = this.config.get(key) as T;

    if (this.configOptions.enableLogging) {
      console.log(`⚙️  ConfigBus: Get "${key}" = ${JSON.stringify(value)}`);
    }

    return value;
  }

  /**
   * Set configuration value
   * Rule #7: Centralized configuration management
   */
  set(key: string, value: ConfigValue): void {
    // Validate value if validation is enabled
    if (this.configOptions.enableValidation && !this.validateValue(key, value)) {
      this.metrics.validationErrors++;
      throw new Error(`ConfigBus: Invalid value for key "${key}": ${JSON.stringify(value)}`);
    }

    // Support dot notation for nested objects
    if (key.includes('.')) {
      this.setNestedValue(key, value);
    } else {
      this.config.set(key, value);
    }

    // Update metrics
    if (this.configOptions.enableMetrics) {
      const currentCount = this.metrics.setCount.get(key) || 0;
      this.metrics.setCount.set(key, currentCount + 1);
      this.metrics.lastAccess.set(key, new Date());
    }

    if (this.configOptions.enableLogging) {
      console.log(`⚙️  ConfigBus: Set "${key}" = ${JSON.stringify(value)}`);
    }
  }

  /**
   * Check if configuration key exists
   */
  has(key: string): boolean {
    if (key.includes('.')) {
      return this.getNestedValue(key) !== undefined;
    }
    return this.config.has(key);
  }

  /**
   * Delete configuration key
   */
  delete(key: string): boolean {
    if (key.includes('.')) {
      return this.deleteNestedValue(key);
    }
    return this.config.delete(key);
  }

  /**
   * Get all configuration keys
   */
  keys(): string[] {
    return Array.from(this.config.keys());
  }

  /**
   * Get all configuration as object
   */
  getAll(): Record<string, ConfigValue> {
    return Object.fromEntries(this.config.entries());
  }

  /**
   * Load configuration from environment variables
   * Automatically maps BUDA_* environment variables
   */
  loadEnvironmentVariables(): void {
    if (typeof process === 'undefined') return;

    Object.entries(process.env).forEach(([envKey, envValue]) => {
      if (envKey.startsWith('BUDA_')) {
        // Convert BUDA_API_BASE_URL to api.baseUrl
        const configKey = envKey
          .substring(5) // Remove 'BUDA_'
          .toLowerCase()
          .replace(/_/g, '.');

        // Parse value (attempt JSON parse for objects/arrays)
        let parsedValue: ConfigValue = envValue || '';
        try {
          parsedValue = JSON.parse(parsedValue as string);
        } catch {
          // Keep as string if not valid JSON
        }

        this.set(configKey, parsedValue);
      }
    });

    if (this.configOptions.enableLogging) {
      const envCount = Object.keys(process.env).filter(k => k.startsWith('BUDA_')).length;
      console.log(`⚙️  ConfigBus: Loaded ${envCount} environment variables`);
    }
  }

  /**
   * Load configuration from object (e.g., config file)
   */
  load(configObject: Record<string, ConfigValue>): void {
    Object.entries(configObject).forEach(([key, value]) => {
      this.set(key, value);
    });

    if (this.configOptions.enableLogging) {
      console.log(`⚙️  ConfigBus: Loaded ${Object.keys(configObject).length} configuration values`);
    }
  }

  /**
   * Get configuration metrics
   */
  getMetrics(): Readonly<ConfigMetrics> {
    return {
      getCount: new Map(this.metrics.getCount),
      setCount: new Map(this.metrics.setCount),
      lastAccess: new Map(this.metrics.lastAccess),
      validationErrors: this.metrics.validationErrors
    };
  }

  /**
   * Get nested value using dot notation
   */
  private getNestedValue(key: string): ConfigValue {
    const parts = key.split('.');
    const rootKey = parts[0];
    const rootValue = this.config.get(rootKey);

    if (!rootValue || typeof rootValue !== 'object') return undefined;

    let current: any = rootValue;
    for (let i = 1; i < parts.length; i++) {
      if (current && typeof current === 'object' && parts[i] in current) {
        current = current[parts[i]];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Set nested value using dot notation
   */
  private setNestedValue(key: string, value: ConfigValue): void {
    const parts = key.split('.');
    const rootKey = parts[0];
    
    // Get or create root object
    let rootValue = this.config.get(rootKey);
    if (!rootValue || typeof rootValue !== 'object') {
      rootValue = {};
      this.config.set(rootKey, rootValue);
    }

    // Navigate to parent of target property
    let current: any = rootValue;
    for (let i = 1; i < parts.length - 1; i++) {
      if (!(parts[i] in current) || typeof current[parts[i]] !== 'object') {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }

    // Set the final value
    current[parts[parts.length - 1]] = value;
  }

  /**
   * Delete nested value using dot notation
   */
  private deleteNestedValue(key: string): boolean {
    const parts = key.split('.');
    const rootKey = parts[0];
    const rootValue = this.config.get(rootKey);

    if (!rootValue || typeof rootValue !== 'object') return false;

    // Navigate to parent of target property
    let current: any = rootValue;
    for (let i = 1; i < parts.length - 1; i++) {
      if (!(parts[i] in current) || typeof current[parts[i]] !== 'object') {
        return false;
      }
      current = current[parts[i]];
    }

    // Delete the final property
    const finalKey = parts[parts.length - 1];
    if (finalKey in current) {
      delete current[finalKey];
      return true;
    }

    return false;
  }

  /**
   * Basic validation for configuration values
   */
  private validateValue(key: string, value: ConfigValue): boolean {
    // Add custom validation logic here
    // For now, just check that we're not setting undefined
    return value !== undefined;
  }
}

// Default singleton instance
export const configBus = new ConfigBus({
  enableLogging: process.env.NODE_ENV === 'development',
  enableMetrics: true,
  enableValidation: true
});