interface CacheEntry {
  response: string;
  createdAt: number;
  hitCount: number;
}

export class ResponseCache {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;
  private ttlMs: number;

  constructor(maxSize = 100, ttlMs = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  private normalizeKey(query: string): string {
    return query
      .toLowerCase()
      .replace(/[¿?¡!.,;:()\-"'«»]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  get(query: string): string | null {
    const key = this.normalizeKey(query);
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (Date.now() - entry.createdAt > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    entry.hitCount++;
    return entry.response;
  }

  set(query: string, response: string): void {
    const key = this.normalizeKey(query);

    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      response,
      createdAt: Date.now(),
      hitCount: 0,
    });
  }

  has(query: string): boolean {
    const key = this.normalizeKey(query);
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() - entry.createdAt > this.ttlMs) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; maxSize: number; ttlMs: number; entries: Array<{ key: string; hitCount: number; ageMs: number }> } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      hitCount: entry.hitCount,
      ageMs: now - entry.createdAt,
    }));

    return { size: this.cache.size, maxSize: this.maxSize, ttlMs: this.ttlMs, entries };
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.clear();
      return;
    }

    const regex = new RegExp(pattern, 'i');
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}
