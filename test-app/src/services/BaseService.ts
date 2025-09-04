/**
 * BaseService - Template for LEGO business logic services
 * Rule 3: LEGO Bricks - Business logic service
 * Rule 4: Four Buses - Uses ConfigBus, no direct dependencies
 * 
 * Instructions:
 * 1. Copy this file to create new services  
 * 2. Replace BaseService with your domain service name
 * 3. Use buses for all external communication
 * 4. Keep services stateless and testable
 */
import { configBus } from '../buses/ConfigBus.js';
import { errorBus } from '../buses/ErrorBus.js';
import type { BaseModel } from '../models/BaseModel.js';

export class BaseService {
  private serviceName = 'BaseService';

  /**
   * Example service method using ConfigBus
   */
  async loadConfig<T>(configKey: string): Promise<T | null> {
    try {
      const config = await configBus.get<T>(configKey);
      return config;
    } catch (error) {
      errorBus.reportError(
        `[${this.serviceName}] Failed to load config: ${configKey}`, 
        error as string
      );
      return null;
    }
  }

  /**
   * Example business logic method
   */
  processData(data: BaseModel): BaseModel {
    try {
      // Business logic here
      const processedData = {
        ...data,
        updatedAt: new Date()
      };
      
      return processedData;
    } catch (error) {
      errorBus.reportError(
        `[${this.serviceName}] Failed to process data`,
        error as string
      );
      throw error;
    }
  }

  /**
   * Example validation method
   */
  validateData(data: any): data is BaseModel {
    const isValid = (
      data &&
      typeof data.id === 'string' &&
      typeof data.name === 'string'
    );

    if (!isValid) {
      errorBus.reportError(
        `[${this.serviceName}] Invalid data format`,
        JSON.stringify(data)
      );
    }

    return isValid;
  }
}