/**
 * ConfigBus - Thin wrapper over native fetch
 * Rule 3: Thin Wrappers - Just get config, nothing else
 */
const cache = new Map<string, any>();

export const configBus = {
  async get<T>(key: string): Promise<T> {
    // In development, add cache-busting timestamp
    const isDev = import.meta.env.DEV;
    const cacheKey = isDev ? `${key}-${Date.now()}` : key;
    
    if (!isDev && cache.has(key)) {
      return cache.get(key);
    }
    
    const url = isDev ? `/config/${key}.json?t=${Date.now()}` : `/config/${key}.json`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (!isDev) {
      cache.set(key, data);
    }
    return data;
  },

  set<T>(key: string, value: T): void {
    cache.set(key, value);
  },

  clearCache(): void {
    cache.clear();
  }
};