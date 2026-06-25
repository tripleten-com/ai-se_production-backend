type CacheEntry = {
  value: unknown;
  createdAt: number;
};

const cache = new Map<string, CacheEntry>();
const TTL_MS = 60 * 1000;

export const getCacheValue = (key: string, ttlMs = TTL_MS): unknown => {
  const entry = cache.get(key);

  if (!entry) return null;

  if (Date.now() - entry.createdAt > ttlMs) {
    cache.delete(key);
    return null;
  }

  return entry.value;
};

export const setCacheValue = (key: string, value: unknown): void => {
  cache.set(key, { value, createdAt: Date.now() });
};

export const deleteCacheValue = (key: string): void => {
  cache.delete(key);
};
