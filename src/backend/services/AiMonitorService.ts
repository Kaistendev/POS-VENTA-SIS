import { UnifiedQueryService } from '../../infrastructure/neural/orchestrator/unifiedQueryService.js';
import { DecisionRecord, DecisionStats } from '../../infrastructure/neural/orchestrator/decisionLogger.js';
import { logger } from '../../shared/logger.js';

export interface AiMonitorSnapshot {
  timestamp: string;
  decisionStats: DecisionStats;
  llmStatus: { available: boolean; circuitOpen: boolean; consecutiveFailures: number };
  ragStats: { documents: number; totalQueries: number; hitRate: number };
  modelLoaded: boolean;
  config: Record<string, unknown>;
}

export class AiMonitorService {
  private unifiedQuery: UnifiedQueryService | null = null;

  setUnifiedQueryService(service: UnifiedQueryService): void {
    this.unifiedQuery = service;
    logger.info('[AiMonitor] Service registered');
  }

  getSnapshot(): AiMonitorSnapshot | null {
    if (!this.unifiedQuery) return null;

    try {
      const stats = this.unifiedQuery.getStats();
      return {
        timestamp: new Date().toISOString(),
        decisionStats: stats.decisionStats,
        llmStatus: {
          available: stats.llmStats.circuitOpen !== undefined ? !stats.llmStats.circuitOpen : true,
          circuitOpen: stats.llmStats.circuitOpen ?? false,
          consecutiveFailures: stats.llmStats.consecutiveFailures ?? 0,
        },
        ragStats: {
          documents: stats.ragStats.documents ?? 0,
          totalQueries: stats.ragStats.totalQueries ?? 0,
          hitRate: stats.ragStats.hitRate ?? 0,
        },
        modelLoaded: stats.orchestratorStats.classifierInfo?.isLoaded ?? false,
        // cast via unknown to safely convert from UnifiedQueryConfig to a generic record
        config: stats.config as unknown as Record<string, unknown>,
      };
    } catch (error) {
      logger.error({ err: error }, '[AiMonitor] Failed to get snapshot');
      return null;
    }
  }

  getHistory(limit?: number): DecisionRecord[] {
    if (!this.unifiedQuery) return [];
    return this.unifiedQuery.getDecisionLogger().getHistory(limit);
  }

  getRecentErrors(limit = 10): DecisionRecord[] {
    if (!this.unifiedQuery) return [];
    return this.unifiedQuery.getDecisionLogger().getRecentBySource('error', limit);
  }

  resetHistory(): void {
    if (!this.unifiedQuery) return;
    this.unifiedQuery.getDecisionLogger().clear();
    logger.info('[AiMonitor] History reset');
  }

  isAvailable(): boolean {
    return this.unifiedQuery !== null;
  }
}
