/**
 * EventBus - Thin wrapper over native EventTarget
 * Rule 3: Thin Wrappers - Just publish/subscribe, nothing else
 */
export class EventBus extends EventTarget {
  publish<T>(topic: string, data: T): void {
    this.dispatchEvent(new CustomEvent(topic, { detail: data }));
  }

  subscribe<T>(topic: string, handler: (data: T) => void): () => void {
    const eventHandler = (event: CustomEvent<T>) => handler(event.detail);
    this.addEventListener(topic, eventHandler as EventListener);
    return () => this.removeEventListener(topic, eventHandler as EventListener);
  }
}

export const eventBus = new EventBus();
