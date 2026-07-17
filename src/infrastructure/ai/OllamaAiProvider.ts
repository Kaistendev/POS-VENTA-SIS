import { IAiProvider } from '../../domain/ports/IAiProvider.js';
import { logger } from '../../shared/logger.js';

export interface OllamaConfig {
  baseUrl: string;
  model: string;
  timeoutMs: number;
  maxRetries: number;
  circuitBreakerThreshold: number;
  circuitBreakerResetMs: number;
}

const DEFAULT_CONFIG: OllamaConfig = {
  baseUrl: process.env.IA_URL ?? 'http://localhost:11434',
  model: 'phi3:latest',
  timeoutMs: 30000,
  maxRetries: 2,
  circuitBreakerThreshold: 3,
  circuitBreakerResetMs: 60000,
};

export class OllamaAiProvider implements IAiProvider {
  private config: OllamaConfig;
  private consecutiveFailures = 0;
  private circuitOpen = false;
  private circuitOpenTime = 0;

  constructor(config?: Partial<OllamaConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async generateResponse(prompt: string, systemContext: string): Promise<string> {
    return this.withCircuitBreaker(async () => {
      const body = JSON.stringify({
        model: this.config.model,
        prompt: `${systemContext}\n\nPregunta: ${prompt}\n\nRespuesta directa:`,
        stream: false,
        options: { temperature: 0.1, top_p: 0.9 },
      });

      const data = await this.fetchWithTimeout<{ response: string }>('/api/generate', body);
      return data.response.trim();
    }, 'generateResponse');
  }

  async classifyIntent(prompt: string, examples: string): Promise<Record<string, unknown> | null> {
    return this.withCircuitBreaker(async () => {
      const body = JSON.stringify({
        model: this.config.model,
        prompt: `${examples}\n\nUsuario: ${prompt}\n\nJSON:`,
        stream: false,
        format: 'json',
        options: { temperature: 0, top_p: 0.5 },
      });

      const data = await this.fetchWithTimeout<{ response: string }>('/api/generate', body);
      const parsed = JSON.parse(data.response.trim());
      if (parsed && typeof parsed === 'object' && parsed.intent) {
        return parsed;
      }
      return null;
    }, 'classifyIntent');
  }

  async generateWithContext(prompt: string, systemPrompt: string, context?: string): Promise<string> {
    return this.withCircuitBreaker(async () => {
      const fullPrompt = context
        ? `${systemPrompt}\n\n${context}\n\nPregunta: ${prompt}\n\nRespuesta:`
        : `${systemPrompt}\n\nPregunta: ${prompt}\n\nRespuesta:`;

      const body = JSON.stringify({
        model: this.config.model,
        prompt: fullPrompt,
        stream: false,
        options: { temperature: 0.2, top_p: 0.9 },
      });

      const data = await this.fetchWithTimeout<{ response: string }>('/api/generate', body);
      return data.response.trim();
    }, 'generateWithContext');
  }

  private async fetchWithTimeout<T>(path: string, body: string): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const res = await fetch(`${this.config.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Ollama responded with ${res.status}: ${text}`);
      }

      return await res.json() as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async withCircuitBreaker<T>(fn: () => Promise<T>, operation: string): Promise<T> {
    if (this.circuitOpen) {
      const elapsed = Date.now() - this.circuitOpenTime;
      if (elapsed < this.config.circuitBreakerResetMs) {
        logger.warn({ operation, remainingMs: this.config.circuitBreakerResetMs - elapsed }, '[Ollama] Circuit open, skipping');
        throw new OllamaCircuitBreakerError();
      }
      this.circuitOpen = false;
      this.consecutiveFailures = 0;
    }

    try {
      const result = await fn();
      this.consecutiveFailures = 0;
      return result;
    } catch (error) {
      if (error instanceof OllamaCircuitBreakerError) throw error;

      this.consecutiveFailures++;
      logger.error({ err: error, operation, consecutiveFailures: this.consecutiveFailures }, '[Ollama] Request failed');

      if (this.consecutiveFailures >= this.config.circuitBreakerThreshold) {
        this.circuitOpen = true;
        this.circuitOpenTime = Date.now();
        logger.warn({ threshold: this.config.circuitBreakerThreshold }, '[Ollama] Circuit opened');
      }

      if (this.consecutiveFailures <= this.config.maxRetries) {
        logger.info({ retry: this.consecutiveFailures, operation }, '[Ollama] Retrying');
        return this.withCircuitBreaker(fn, operation);
      }

      throw error;
    }
  }

  isAvailable(): boolean {
    return !this.circuitOpen;
  }

  getStats() {
    return {
      baseUrl: this.config.baseUrl,
      model: this.config.model,
      circuitOpen: this.circuitOpen,
      consecutiveFailures: this.consecutiveFailures,
      timeoutMs: this.config.timeoutMs,
    };
  }

  resetCircuitBreaker(): void {
    this.circuitOpen = false;
    this.consecutiveFailures = 0;
    logger.info('[Ollama] Circuit breaker reset');
  }
}

export class OllamaCircuitBreakerError extends Error {
  constructor() {
    super('Ollama circuit breaker is open');
    this.name = 'OllamaCircuitBreakerError';
  }
}
