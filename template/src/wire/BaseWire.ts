/**
 * BaseWire - Template for LEGO coordinator wiring
 * Rule 3: LEGO Bricks - Coordinator wiring between layers
 * Rule 4: Four Buses - Orchestrates bus communications
 * Rule 8: Design for deletion - Includes dispose() method
 * 
 * Instructions:
 * 1. Copy this file to create new wire coordinators
 * 2. Replace BaseWire with your domain wire name
 * 3. Wire together models, services, and UI via buses
 * 4. Keep wiring logic thin - no business logic here
 */
import { eventBus } from '../buses/EventBus.js';
import { stateBus } from '../buses/StateBus.js';
import { errorBus } from '../buses/ErrorBus.js';
import { BaseService } from '../services/BaseService.js';
import type { BaseModel } from '../models/BaseModel.js';

export class BaseWire {
  private service: BaseService;
  private unsubscribeFunctions: (() => void)[] = [];
  private wireName = 'BaseWire';

  constructor() {
    this.service = new BaseService();
    this.initialize();
  }

  private initialize(): void {
    try {
      // Wire up event subscriptions
      this.setupEventHandlers();
      
      console.log(`[${this.wireName}] Initialized successfully`);
    } catch (error) {
      errorBus.reportError(
        `[${this.wireName}] Failed to initialize`,
        error as string
      );
    }
  }

  private setupEventHandlers(): void {
    // Handle data requests
    const unsubscribeDataRequest = eventBus.subscribe(
      'data:request', 
      this.handleDataRequest.bind(this)
    );

    // Handle actions  
    const unsubscribeAction = eventBus.subscribe(
      'action:triggered',
      this.handleAction.bind(this)
    );

    // Handle state changes
    const unsubscribeState = eventBus.subscribe(
      'state:data',
      this.handleStateChange.bind(this)
    );

    this.unsubscribeFunctions = [
      unsubscribeDataRequest,
      unsubscribeAction, 
      unsubscribeState
    ];
  }

  private async handleDataRequest(request: { component: string }): Promise<void> {
    try {
      // Get data from service
      const config = await this.service.loadConfig('base-data');
      
      if (config) {
        // Publish data update
        eventBus.publish('data:updated', config);
        
        // Update state
        stateBus.setState('current-data', config);
      } else {
        // Publish empty state
        eventBus.publish('data:updated', null);
      }
    } catch (error) {
      errorBus.reportError(
        `[${this.wireName}] Failed to handle data request`,
        error as string
      );
    }
  }

  private handleAction(action: { component: string; action: string; timestamp: number }): void {
    try {
      console.log(`[${this.wireName}] Handling action:`, action);
      
      // Process action through service
      const currentData = stateBus.getState('current-data');
      
      if (currentData && this.service.validateData(currentData)) {
        const processedData = this.service.processData(currentData as BaseModel);
        
        // Update state and notify UI
        stateBus.setState('current-data', processedData);
        eventBus.publish('data:updated', processedData);
      }
    } catch (error) {
      errorBus.reportError(
        `[${this.wireName}] Failed to handle action`,
        error as string
      );
    }
  }

  private handleStateChange(data: any): void {
    try {
      console.log(`[${this.wireName}] State changed:`, data);
      
      // Notify other components of state change
      eventBus.publish('state:changed', {
        wire: this.wireName,
        data,
        timestamp: Date.now()
      });
    } catch (error) {
      errorBus.reportError(
        `[${this.wireName}] Failed to handle state change`,
        error as string
      );
    }
  }

  /**
   * Cleanup method for deletion (Rule 8: Design for deletion)
   */
  dispose(): void {
    try {
      // Unsubscribe from all events
      this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
      this.unsubscribeFunctions = [];
      
      // Clear any stored state
      stateBus.setState('current-data', null);
      
      console.log(`[${this.wireName}] Disposed successfully`);
    } catch (error) {
      errorBus.reportError(
        `[${this.wireName}] Failed to dispose`,
        error as string
      );
    }
  }
}