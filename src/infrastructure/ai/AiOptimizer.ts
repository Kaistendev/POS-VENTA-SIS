interface SmartCacheEntry {
  response: string;
  createdAt: number;
  hitCount: number;
  normalizedKey: string;
}

export class AiOptimizer {
  private cache: Map<string, SmartCacheEntry>;
  private maxSize: number;
  private ttlMs: number;

  constructor(maxSize = 200, ttlMs = 10 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  private normalize(input: string): string {
    return input
      .toLowerCase()
      .replace(/[¿?¡!.,;:()\-"'«»]/g, '')
      .replace(/\b(un|una|el|la|los|las|de|del|para|por|con|sin|en|al|que|es|se|su|lo)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private semanticKey(input: string): string {
    const normalized = this.normalize(input);
    const words = normalized.split(' ').sort();
    return words.join('_');
  }

  findCached(query: string): string | null {
    const key = this.semanticKey(query);
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.createdAt > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    entry.hitCount++;
    return entry.response;
  }

  setCache(query: string, response: string): void {
    const key = this.semanticKey(query);

    if (this.cache.size >= this.maxSize) {
      let leastUsed: { key: string; hitCount: number } | null = null;
      for (const [k, v] of this.cache.entries()) {
        if (!leastUsed || v.hitCount < leastUsed.hitCount) {
          leastUsed = { key: k, hitCount: v.hitCount };
        }
      }
      if (leastUsed) this.cache.delete(leastUsed.key);
    }

    this.cache.set(key, {
      response,
      createdAt: Date.now(),
      hitCount: 0,
      normalizedKey: this.normalize(query),
    });
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    const regex = new RegExp(pattern, 'i');
    for (const [key, entry] of this.cache.entries()) {
      if (regex.test(key) || regex.test(entry.normalizedKey)) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key: key.substring(0, 40),
      hitCount: entry.hitCount,
      ageMs: now - entry.createdAt,
    }));
    return { size: this.cache.size, maxSize: this.maxSize, ttlMs: this.ttlMs, entries };
  }
}
