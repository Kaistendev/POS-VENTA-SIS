export class CacheService {
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private defaultTTL: number;

  constructor(defaultTTL: number = 30000) {
    this.defaultTTL = defaultTTL;
  }

  async getOrSet<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    const now = Date.now();
    const effectiveTTL = ttl ?? this.defaultTTL;
    const entry = this.cache.get(key);

    if (entry && now - entry.timestamp < effectiveTTL) {
      return entry.data as T;
    }

    const data = await fn();
    this.cache.set(key, { data, timestamp: now });
    return data;
  }

  invalidate(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}
