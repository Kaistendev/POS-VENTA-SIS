import { IntentClassifierService, PredictionResult } from '../models/IntentClassifierService.js';
import { ResponseCache } from '../pipeline/responseCache.js';
import { IntentCategory, INTENT_LABELS } from '../types.js';

export interface OrchestratorResult {
  intent: IntentCategory;
  confidence: number;
  source: 'cache' | 'neural' | 'llm';
  latencyMs: number;
  allProbabilities: number[];
}

export interface OrchestratorConfig {
  confidenceThreshold: number;
  cacheMaxSize: number;
  cacheTtlMs: number;
  llmFallback: boolean;
}

export const DEFAULT_ORCHESTRATOR_CONFIG: OrchestratorConfig = {
  confidenceThreshold: 0.7,
  cacheMaxSize: 100,
  cacheTtlMs: 5 * 60 * 1000,
  llmFallback: true,
};

export class NeuralOrchestrator {
  private classifier: IntentClassifierService;
  private cache: ResponseCache;
  private config: OrchestratorConfig;
  private totalPredictions = 0;
  private cacheHits = 0;
  private highConfidenceCount = 0;
  private lowConfidenceCount = 0;

  constructor(
    classifier: IntentClassifierService,
    cache?: ResponseCache,
    config?: Partial<OrchestratorConfig>,
  ) {
    this.classifier = classifier;
    this.cache = cache ?? new ResponseCache();
    this.config = { ...DEFAULT_ORCHESTRATOR_CONFIG, ...config };
  }

  async classify(input: string): Promise<OrchestratorResult> {
    const startTime = performance.now();
    this.totalPredictions++;

    const cached = this.cache.get(input);
    if (cached !== null) {
      this.cacheHits++;
      const parsed = JSON.parse(cached) as { intent: IntentCategory; confidence: number };
      const latencyMs = performance.now() - startTime;
      return {
        intent: parsed.intent,
        confidence: parsed.confidence,
        source: 'cache',
        latencyMs: parseFloat(latencyMs.toFixed(2)),
        allProbabilities: [],
      };
    }

    const prediction = await this.classifier.predict(input);
    const latencyMs = performance.now() - startTime;

    const allProbabilities = this.toProbArray(prediction);

    if (prediction.confidence >= this.config.confidenceThreshold) {
      this.highConfidenceCount++;
      this.cache.set(input, JSON.stringify({
        intent: prediction.intent,
        confidence: prediction.confidence,
      }));
      return {
        intent: prediction.intent,
        confidence: prediction.confidence,
        source: 'neural',
        latencyMs,
        allProbabilities,
      };
    }

    this.lowConfidenceCount++;
    return {
      intent: prediction.intent,
      confidence: prediction.confidence,
      source: 'llm',
      latencyMs,
      allProbabilities,
    };
  }

  private toProbArray(prediction: PredictionResult): number[] {
    return INTENT_LABELS.map(intent => {
      const val = prediction.allProbabilities[intent];
      return val ?? 0;
    });
  }

  async isModelLoaded(): Promise<boolean> {
    return this.classifier.getModelInfo().isLoaded;
  }

  getCache(): ResponseCache {
    return this.cache;
  }

  getStats() {
    return {
      totalPredictions: this.totalPredictions,
      cacheHits: this.cacheHits,
      cacheHitRate: this.totalPredictions > 0
        ? parseFloat((this.cacheHits / this.totalPredictions * 100).toFixed(1))
        : 0,
      highConfidenceCount: this.highConfidenceCount,
      lowConfidenceCount: this.lowConfidenceCount,
      classifierInfo: this.classifier.getModelInfo(),
      config: this.config,
    };
  }

  dispose(): void {
    this.classifier.dispose();
    this.cache.clear();
  }
}
