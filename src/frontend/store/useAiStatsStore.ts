import { create } from 'zustand';

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

export interface AiMonitorSnapshot {
  timestamp: string;
  decisionStats: DecisionStats;
  llmStatus: { available: boolean; circuitOpen: boolean; consecutiveFailures: number };
  ragStats: { documents: number; totalQueries: number; hitRate: number };
  modelLoaded: boolean;
}

interface AiStatsState {
  snapshot: AiMonitorSnapshot | null;
  history: Record<string, unknown>[];
  loading: boolean;
  error: string | null;
  autoRefreshInterval: number;
  fetchStats: () => Promise<void>;
  fetchHistory: (limit?: number) => Promise<void>;
  resetStats: () => Promise<void>;
  startAutoRefresh: () => () => void;
}

export const useAiStatsStore = create<AiStatsState>((set, get) => ({
  snapshot: null,
  history: [],
  loading: false,
  error: null,
  autoRefreshInterval: 10000,

  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const res = await window.api.getAiStats();
      if (res.success && res.data) {
        set({ snapshot: res.data as AiMonitorSnapshot, loading: false });
      } else {
        set({ error: res.message ?? 'Unknown error', loading: false });
      }
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  fetchHistory: async (limit = 50) => {
    try {
      const res = await window.api.getAiStatsHistory(limit);
      if (res.success && Array.isArray(res.data)) {
        set({ history: res.data as Record<string, unknown>[] });
      }
    } catch {
      // silent
    }
  },

  resetStats: async () => {
    try {
      await window.api.resetAiStats();
      set({ snapshot: null, history: [] });
    } catch {
      // silent
    }
  },

  startAutoRefresh: () => {
    const fetchAll = () => {
      get().fetchStats();
      get().fetchHistory(30);
    };
    fetchAll();
    const id = setInterval(fetchAll, get().autoRefreshInterval);
    return () => clearInterval(id);
  },
}));
