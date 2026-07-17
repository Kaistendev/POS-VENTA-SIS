import { KnowledgeBase, SearchResult } from './knowledgeBase.js';
import { logger } from '../../shared/logger.js';

export interface RagConfig {
  maxResults: number;
  minScore: number;
}

export const DEFAULT_RAG_CONFIG: RagConfig = {
  maxResults: 3,
  minScore: 0.01,
};

export class RagService {
  private kb: KnowledgeBase;
  private config: RagConfig;
  private totalQueries = 0;
  private queriesWithResults = 0;

  constructor(knowledgeBase: KnowledgeBase, config?: Partial<RagConfig>) {
    this.kb = knowledgeBase;
    this.config = { ...DEFAULT_RAG_CONFIG, ...config };
  }

  async retrieve(query: string): Promise<{
    results: SearchResult[];
    context: string;
  }> {
    this.totalQueries++;
    const results = this.kb.search(query, this.config.maxResults)
      .filter(r => r.score >= this.config.minScore);

    if (results.length > 0) this.queriesWithResults++;

    const context = results.length > 0
      ? results.map(r =>
          `[${r.document.title}]: ${r.document.content.slice(0, 500)}`,
        ).join('\n\n')
      : '';

    logger.debug(
      { query, results: results.length, topScore: results[0]?.score ?? 0 },
      '[RAG] Retrieval',
    );

    return { results, context };
  }

  getStats() {
    return {
      documents: this.kb.getStats().count,
      totalQueries: this.totalQueries,
      queriesWithResults: this.queriesWithResults,
      hitRate: this.totalQueries > 0
        ? parseFloat((this.queriesWithResults / this.totalQueries * 100).toFixed(1))
        : 0,
      config: this.config,
    };
  }
}
