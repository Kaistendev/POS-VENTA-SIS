import { IntentCategory, INTENT_LABELS } from '../types.js';
import { logger } from '../../../shared/logger.js';

export interface AmbiguityConfig {
  marginThreshold: number;
  llmNullThreshold: number;
}

export const DEFAULT_AMBIGUITY_CONFIG: AmbiguityConfig = {
  marginThreshold: 0.15,
  llmNullThreshold: 2,
};

export interface AmbiguityResult {
  isAmbiguous: boolean;
  ambiguityScore: number;
  topIntent: IntentCategory;
  topConfidence: number;
  nextBestIntent: IntentCategory | null;
  nextBestConfidence: number;
  margin: number;
}

export class AmbiguityDetector {
  private config: AmbiguityConfig;

  constructor(config?: Partial<AmbiguityConfig>) {
    this.config = { ...DEFAULT_AMBIGUITY_CONFIG, ...config };
  }

  analyzeProbabilities(probabilities: number[]): AmbiguityResult {
    const indexed = probabilities
      .map((p, i) => ({ confidence: p, index: i }))
      .sort((a, b) => b.confidence - a.confidence);

    const top = indexed[0];
    const next = indexed[1];

    const topIntent = INTENT_LABELS[top.index] ?? 'general';
    const nextIntent = next ? (INTENT_LABELS[next.index] ?? null) : null;
    const margin = top.confidence - (next?.confidence ?? 0);
    const isAmbiguous = margin < this.config.marginThreshold;

    logger.debug(
      { topIntent, topConfidence: top.confidence.toFixed(4), nextIntent, margin: margin.toFixed(4), isAmbiguous },
      '[Ambiguity] Analysis',
    );

    return {
      isAmbiguous,
      ambiguityScore: parseFloat(Math.max(0, 1 - margin).toFixed(4)),
      topIntent,
      topConfidence: top.confidence,
      nextBestIntent: nextIntent,
      nextBestConfidence: next?.confidence ?? 0,
      margin: parseFloat(margin.toFixed(4)),
    };
  }
}
