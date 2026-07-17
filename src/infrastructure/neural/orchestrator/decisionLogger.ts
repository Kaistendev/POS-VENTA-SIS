import { IntentCategory } from '../types.js';
import { logger } from '../../../shared/logger.js';

export interface DecisionRecord {
  timestamp: string;
  query: string;
  source: 'cache' | 'neural' | 'llm' | 'error';
  intent: IntentCategory;
  confidence: number;
  latencyMs: number;
  ragUsed: boolean;
  fallbackUsed: boolean;
  ambiguous: boolean;
  ambiguityScore: number;
  error?: string;
}

export interface DecisionStats {
  totalQueries: number;
  cacheHits: number;
  neuralCount: number;
  llmCount: number;
  errorCount: number;
  ambiguousCount: number;
  ragUsedCount: number;
  fallbackCount: number;
  cacheHitRate: number;
  neuralRatio: number;
  llmRatio: number;
  ambiguityRate: number;
  avgLatencyMs: number;
  sourceDistribution: Record<string, number>;
  intentDistribution: Record<string, number>;
  recentQueries: number;
}

export class DecisionLogger {
  private history: DecisionRecord[] = [];
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  log(record: DecisionRecord): void {
    this.history.push(record);
    if (this.history.length > this.maxSize) {
      this.history.shift();
    }

    const level = record.source === 'error' ? 'warn' : 'info';
    logger[level](
      {
        source: record.source,
        intent: record.intent,
        confidence: parseFloat(record.confidence.toFixed(4)),
        latencyMs: parseFloat(record.latencyMs.toFixed(2)),
        ambiguous: record.ambiguous,
        ragUsed: record.ragUsed,
        fallbackUsed: record.fallbackUsed,
        error: record.error,
      },
      `[Decision] ${record.source} → ${record.intent} (${(record.confidence * 100).toFixed(1)}%)`,
    );
  }

  getStats(): DecisionStats {
    const total = this.history.length;
    if (total === 0) {
      return {
        totalQueries: 0, cacheHits: 0, neuralCount: 0, llmCount: 0,
        errorCount: 0, ambiguousCount: 0, ragUsedCount: 0, fallbackCount: 0,
        cacheHitRate: 0, neuralRatio: 0, llmRatio: 0, ambiguityRate: 0,
        avgLatencyMs: 0, sourceDistribution: {}, intentDistribution: {},
        recentQueries: 0,
      };
    }

    const cacheHits = this.history.filter(r => r.source === 'cache').length;
    const neuralCount = this.history.filter(r => r.source === 'neural').length;
    const llmCount = this.history.filter(r => r.source === 'llm').length;
    const errorCount = this.history.filter(r => r.source === 'error').length;
    const ambiguousCount = this.history.filter(r => r.ambiguous).length;
    const ragUsedCount = this.history.filter(r => r.ragUsed).length;
    const fallbackCount = this.history.filter(r => r.fallbackUsed).length;

    const totalLatency = this.history.reduce((sum, r) => sum + r.latencyMs, 0);

    const sourceDistribution: Record<string, number> = {};
    const intentDistribution: Record<string, number> = {};
    for (const r of this.history) {
      sourceDistribution[r.source] = (sourceDistribution[r.source] ?? 0) + 1;
      intentDistribution[r.intent] = (intentDistribution[r.intent] ?? 0) + 1;
    }

    return {
      totalQueries: total,
      cacheHits,
      neuralCount,
      llmCount,
      errorCount,
      ambiguousCount,
      ragUsedCount,
      fallbackCount,
      cacheHitRate: parseFloat((cacheHits / total * 100).toFixed(1)),
      neuralRatio: parseFloat((neuralCount / total * 100).toFixed(1)),
      llmRatio: parseFloat((llmCount / total * 100).toFixed(1)),
      ambiguityRate: parseFloat((ambiguousCount / total * 100).toFixed(1)),
      avgLatencyMs: parseFloat((totalLatency / total).toFixed(2)),
      sourceDistribution,
      intentDistribution,
      recentQueries: this.history.length,
    };
  }

  getHistory(limit = 50): DecisionRecord[] {
    return this.history.slice(-limit);
  }

  getRecentBySource(source: DecisionRecord['source'], limit = 10): DecisionRecord[] {
    return this.history.filter(r => r.source === source).slice(-limit);
  }

  clear(): void {
    this.history = [];
    logger.info('[DecisionLogger] History cleared');
  }
}
