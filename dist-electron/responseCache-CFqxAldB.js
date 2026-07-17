//#region src/infrastructure/neural/pipeline/responseCache.ts
var ResponseCache = class {
	cache;
	maxSize;
	ttlMs;
	constructor(maxSize = 100, ttlMs = 300 * 1e3) {
		this.cache = /* @__PURE__ */ new Map();
		this.maxSize = maxSize;
		this.ttlMs = ttlMs;
	}
	normalizeKey(query) {
		return query.toLowerCase().replace(/[¿?¡!.,;:()\-"'«»]/g, "").replace(/\s+/g, " ").trim();
	}
	get(query) {
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
	set(query, response) {
		const key = this.normalizeKey(query);
		if (this.cache.size >= this.maxSize) {
			const oldestKey = this.cache.keys().next().value;
			if (oldestKey) this.cache.delete(oldestKey);
		}
		this.cache.set(key, {
			response,
			createdAt: Date.now(),
			hitCount: 0
		});
	}
	has(query) {
		const key = this.normalizeKey(query);
		const entry = this.cache.get(key);
		if (!entry) return false;
		if (Date.now() - entry.createdAt > this.ttlMs) {
			this.cache.delete(key);
			return false;
		}
		return true;
	}
	clear() {
		this.cache.clear();
	}
	getStats() {
		const now = Date.now();
		const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
			key,
			hitCount: entry.hitCount,
			ageMs: now - entry.createdAt
		}));
		return {
			size: this.cache.size,
			maxSize: this.maxSize,
			ttlMs: this.ttlMs,
			entries
		};
	}
	invalidate(pattern) {
		if (!pattern) {
			this.clear();
			return;
		}
		const regex = new RegExp(pattern, "i");
		for (const key of this.cache.keys()) if (regex.test(key)) this.cache.delete(key);
	}
};
//#endregion
export { ResponseCache as t };
