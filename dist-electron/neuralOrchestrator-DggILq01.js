import { n as INTENT_LABELS } from "./types-CW-fkx8v.js";
import { t as ResponseCache } from "./responseCache-CFqxAldB.js";
//#region src/infrastructure/neural/orchestrator/neuralOrchestrator.ts
var DEFAULT_ORCHESTRATOR_CONFIG = {
	confidenceThreshold: .7,
	cacheMaxSize: 100,
	cacheTtlMs: 300 * 1e3,
	llmFallback: true
};
var NeuralOrchestrator = class {
	classifier;
	cache;
	config;
	totalPredictions = 0;
	cacheHits = 0;
	highConfidenceCount = 0;
	lowConfidenceCount = 0;
	constructor(classifier, cache, config) {
		this.classifier = classifier;
		this.cache = cache ?? new ResponseCache();
		this.config = {
			...DEFAULT_ORCHESTRATOR_CONFIG,
			...config
		};
	}
	async classify(input) {
		const startTime = performance.now();
		this.totalPredictions++;
		const cached = this.cache.get(input);
		if (cached !== null) {
			this.cacheHits++;
			const parsed = JSON.parse(cached);
			const latencyMs = performance.now() - startTime;
			return {
				intent: parsed.intent,
				confidence: parsed.confidence,
				source: "cache",
				latencyMs: parseFloat(latencyMs.toFixed(2)),
				allProbabilities: []
			};
		}
		const prediction = await this.classifier.predict(input);
		const latencyMs = performance.now() - startTime;
		const allProbabilities = this.toProbArray(prediction);
		if (prediction.confidence >= this.config.confidenceThreshold) {
			this.highConfidenceCount++;
			this.cache.set(input, JSON.stringify({
				intent: prediction.intent,
				confidence: prediction.confidence
			}));
			return {
				intent: prediction.intent,
				confidence: prediction.confidence,
				source: "neural",
				latencyMs,
				allProbabilities
			};
		}
		this.lowConfidenceCount++;
		return {
			intent: prediction.intent,
			confidence: prediction.confidence,
			source: "llm",
			latencyMs,
			allProbabilities
		};
	}
	toProbArray(prediction) {
		return INTENT_LABELS.map((intent) => {
			return prediction.allProbabilities[intent] ?? 0;
		});
	}
	async isModelLoaded() {
		return this.classifier.getModelInfo().isLoaded;
	}
	getCache() {
		return this.cache;
	}
	getStats() {
		return {
			totalPredictions: this.totalPredictions,
			cacheHits: this.cacheHits,
			cacheHitRate: this.totalPredictions > 0 ? parseFloat((this.cacheHits / this.totalPredictions * 100).toFixed(1)) : 0,
			highConfidenceCount: this.highConfidenceCount,
			lowConfidenceCount: this.lowConfidenceCount,
			classifierInfo: this.classifier.getModelInfo(),
			config: this.config
		};
	}
	dispose() {
		this.classifier.dispose();
		this.cache.clear();
	}
};
//#endregion
export { NeuralOrchestrator };
