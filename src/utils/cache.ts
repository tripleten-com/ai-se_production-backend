type CacheEntry = {
  value: unknown;
  createdAt: number;
  ttlMs: number;
};

const cache = new Map<string, CacheEntry>();
const TTL_MS = 60 * 1000;

export const getCacheValue = (key: string): unknown => {
  const entry = cache.get(key);

  if (!entry) return null;

  if (Date.now() - entry.createdAt > entry.ttlMs) {
    cache.delete(key);
    return null;
  }

  return entry.value;
};

export const setCacheValue = (
  key: string,
  value: unknown,
  ttlMs = TTL_MS,
): void => {
  cache.set(key, { value, createdAt: Date.now(), ttlMs });
};

export const deleteCacheValue = (key: string): void => {
  cache.delete(key);
};
