/**
 * StateBus - Thin wrapper over localStorage with reactivity
 * Rule 3: Thin Wrappers - Just state get/set with basic reactivity
 */
import { eventBus } from './EventBus.js';

export const stateBus = {
  setState<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
    eventBus.publish(`state:${key}`, value);
  },

  getState<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },

  watchState<T>(key: string, handler: (value: T) => void): () => void {
    return eventBus.subscribe(`state:${key}`, handler);
  }
};