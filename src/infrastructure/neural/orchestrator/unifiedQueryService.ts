import { NeuralOrchestrator, OrchestratorResult } from './neuralOrchestrator.js';
import { OllamaAiProvider } from '../../ai/OllamaAiProvider.js';
import { RagService } from '../../rag/ragService.js';
import { ResponseCache } from '../pipeline/responseCache.js';
import { IntentCategory, INTENT_LABELS } from '../types.js';
import { SYSTEM_PROMPT, buildRagPrompt } from '../../ai/prompts.js';
import { AmbiguityDetector } from './ambiguityDetector.js';
import { DecisionLogger, DecisionRecord } from './decisionLogger.js';
import { logger } from '../../../shared/logger.js';

export interface UnifiedQueryConfig {
  confidenceThreshold: number;
  useRag: boolean;
  llmFallback: boolean;
  cacheResponses: boolean;
  cacheTtlMs: number;
  cacheMaxSize: number;
  llmTimeoutMs: number;
  ambiguityMargin: number;
}

export const DEFAULT_UNIFIED_CONFIG: UnifiedQueryConfig = {
  confidenceThreshold: 0.7,
  useRag: true,
  llmFallback: true,
  cacheResponses: true,
  cacheTtlMs: 5 * 60 * 1000,
  cacheMaxSize: 100,
  llmTimeoutMs: 30000,
  ambiguityMargin: 0.15,
};

export interface UnifiedQueryResult {
  intent: IntentCategory;
  confidence: number;
  response: string;
  source: 'cache' | 'neural' | 'llm' | 'error';
  latencyMs: number;
  ragUsed: boolean;
  fallbackUsed: boolean;
  ambiguous: boolean;
  ambiguityScore: number;
}

export class UnifiedQueryService {
  private orchestrator: NeuralOrchestrator;
  private llm: OllamaAiProvider;
  private rag: RagService;
  private cache: ResponseCache;
  private config: UnifiedQueryConfig;
  private ambiguityDetector: AmbiguityDetector;
  private decisionLogger: DecisionLogger;

  constructor(
    orchestrator: NeuralOrchestrator,
    llm: OllamaAiProvider,
    rag: RagService,
    cache?: ResponseCache,
    config?: Partial<UnifiedQueryConfig>,
    decisionLogger?: DecisionLogger,
  ) {
    this.orchestrator = orchestrator;
    this.llm = llm;
    this.rag = rag;
    this.cache = cache ?? new ResponseCache();
    this.config = { ...DEFAULT_UNIFIED_CONFIG, ...config };
    this.ambiguityDetector = new AmbiguityDetector({ marginThreshold: this.config.ambiguityMargin });
    this.decisionLogger = decisionLogger ?? new DecisionLogger();
  }

  async query(input: string): Promise<UnifiedQueryResult> {
    const startTime = performance.now();

    const cached = this.checkCache(input);
    if (cached) {
      const latencyMs = parseFloat((performance.now() - startTime).toFixed(2));
      const result: UnifiedQueryResult = { ...cached, latencyMs };
      this.logDecision(input, result);
      return result;
    }

    const classification = await this.classify(input);
    const ambiguity = this.ambiguityDetector.analyzeProbabilities(classification.allProbabilities);
    const response = await this.generateResponse(input, classification, ambiguity);
    const latencyMs = parseFloat((performance.now() - startTime).toFixed(2));

    const result: UnifiedQueryResult = {
      intent: response.source === 'llm' ? classification.intent : classification.intent,
      confidence: classification.confidence,
      response: response.text,
      source: response.source,
      latencyMs,
      ragUsed: response.ragUsed,
      fallbackUsed: response.fallbackUsed,
      ambiguous: ambiguity.isAmbiguous,
      ambiguityScore: ambiguity.ambiguityScore,
    };

    if (this.config.cacheResponses && result.source !== 'error') {
      this.cache.set(input, JSON.stringify(result));
    }

    this.logDecision(input, result);
    return result;
  }

  private async classify(input: string): Promise<OrchestratorResult & { allProbabilities: number[] }> {
    const result = await this.orchestrator.classify(input);
    return { ...result, allProbabilities: result.allProbabilities ?? [] };
  }

  private async generateResponse(
    input: string,
    classification: OrchestratorResult & { allProbabilities: number[] },
    ambiguity: { isAmbiguous: boolean; ambiguityScore: number },
  ): Promise<{ text: string; source: 'neural' | 'llm' | 'error'; ragUsed: boolean; fallbackUsed: boolean }> {
    const isHighConfidence = classification.confidence >= this.config.confidenceThreshold;

    if (isHighConfidence && !ambiguity.isAmbiguous) {
      return {
        text: this.buildNeuralResponse(input, classification.intent),
        source: 'neural',
        ragUsed: false,
        fallbackUsed: false,
      };
    }

    if (!this.config.llmFallback) {
      return {
        text: this.buildNeuralResponse(input, classification.intent),
        source: 'neural',
        ragUsed: false,
        fallbackUsed: false,
      };
    }

    let ragContext = '';
    if (this.config.useRag) {
      const retrieved = await this.rag.retrieve(input);
      ragContext = retrieved.context;
    }

    try {
      const llmResponse = await this.llm.generateWithContext(
        input,
        SYSTEM_PROMPT,
        ragContext || undefined,
      );
      return {
        text: llmResponse,
        source: 'llm',
        ragUsed: ragContext.length > 0,
        fallbackUsed: false,
      };
    } catch (error) {
      logger.error({ err: error, input }, '[UnifiedQuery] LLM failed, using fallback');
      return {
        text: this.buildNeuralFallbackResponse(ambiguity),
        source: 'error',
        ragUsed: ragContext.length > 0,
        fallbackUsed: true,
      };
    }
  }

  private buildNeuralResponse(input: string, intent: IntentCategory): string {
    switch (intent) {
      case 'product_query':
        return 'Consultando información de productos...';
      case 'entity_count':
        return 'Consultando cantidades en el sistema...';
      case 'entity_creation':
        return 'Preparando formulario de creación...';
      case 'data_modification':
        return 'Preparando modificación de datos...';
      case 'data_deletion':
        return 'Preparando eliminación de datos...';
      case 'sale_draft':
        return 'Preparando borrador de venta...';
      case 'sales_summary':
        return 'Consultando resumen de ventas...';
      case 'general':
        return 'Procesando tu consulta...';
      default:
        return 'Procesando tu solicitud...';
    }
  }

  private buildNeuralFallbackResponse(ambiguity: { isAmbiguous: boolean; topIntent?: IntentCategory }): string {
    if (ambiguity.isAmbiguous) {
      return 'No estoy seguro de lo que necesitas. ¿Podrías ser más específico? Por ejemplo: "precio del arroz", "cuantos productos hay", o "crea un cliente nuevo".';
    }
    return 'El asistente IA no está disponible en este momento. Intenta de nuevo más tarde.';
  }

  private checkCache(input: string): UnifiedQueryResult | null {
    if (!this.config.cacheResponses) return null;

    const cached = this.cache.get(input);
    if (cached !== null) {
      try {
        const parsed = JSON.parse(cached) as UnifiedQueryResult;
        return { ...parsed, source: 'cache' };
      } catch {
        this.cache.invalidate(input);
      }
    }
    return null;
  }

  private logDecision(query: string, result: UnifiedQueryResult): void {
    this.decisionLogger.log({
      timestamp: new Date().toISOString(),
      query: query.slice(0, 200),
      source: result.source,
      intent: result.intent,
      confidence: result.confidence,
      latencyMs: result.latencyMs,
      ragUsed: result.ragUsed,
      fallbackUsed: result.fallbackUsed,
      ambiguous: result.ambiguous,
      ambiguityScore: result.ambiguityScore,
      error: result.source === 'error' ? 'LLM unavailable' : undefined,
    });
  }

  getDecisionLogger(): DecisionLogger {
    return this.decisionLogger;
  }

  getStats() {
    return {
      decisionStats: this.decisionLogger.getStats(),
      orchestratorStats: this.orchestrator.getStats(),
      llmStats: this.llm.getStats(),
      ragStats: this.rag.getStats(),
      config: this.config,
    };
  }

  dispose(): void {
    this.orchestrator.dispose();
    this.cache.clear();
  }
}
