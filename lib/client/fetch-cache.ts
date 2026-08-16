type CacheEntry<T> = {
  data?: T;
  at?: number;
  promise?: Promise<T>;
};

const store = new Map<string, CacheEntry<unknown>>();

/**
 * Deduplicate in-flight requests and reuse fresh responses for a short TTL.
 * Helps when gallery ↔ judge routes mount/unmount quickly.
 */
export function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 30_000
): Promise<T> {
  const now = Date.now();
  const entry = store.get(key) as CacheEntry<T> | undefined;

  if (entry?.data !== undefined && entry.at !== undefined && now - entry.at < ttlMs) {
    return Promise.resolve(entry.data);
  }

  if (entry?.promise) {
    return entry.promise;
  }

  const promise = fetcher()
    .then((data) => {
      store.set(key, { data, at: Date.now() });
      return data;
    })
    .catch((error) => {
      const current = store.get(key) as CacheEntry<T> | undefined;
      if (current?.promise === promise) {
        store.delete(key);
      }
      throw error;
    })
    .finally(() => {
      const current = store.get(key) as CacheEntry<T> | undefined;
      if (current?.promise === promise) {
        store.set(key, { data: current.data, at: current.at });
      }
    });

  store.set(key, { ...entry, promise });
  return promise;
}

export function invalidateFetchCache(key?: string): void {
  if (!key) {
    store.clear();
    return;
  }
  store.delete(key);
}

export function invalidateFetchCacheByPrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
