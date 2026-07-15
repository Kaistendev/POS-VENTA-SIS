import { IAiProvider } from '../../domain/ports/IAiProvider.js';
import { logger } from '../../shared/logger.js';

export class OllamaAiProvider implements IAiProvider {
  constructor(
    private baseUrl: string = process.env.IA_URL ?? '',
    private model: string = 'phi3:latest',
  ) {}

  async generateResponse(prompt: string, systemContext: string): Promise<string> {
    try {
      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt: `${systemContext}\n\nPregunta: ${prompt}\n\nRespuesta directa:`,
          stream: false,
          options: {
            temperature: 0.1,
            top_p: 0.9,
          },
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Ollama responded with ${res.status}: ${text}`);
      }

      const data = await res.json() as { response: string };
      return data.response.trim();
    } catch (error) {
      logger.error({ err: error }, '[Ollama] Failed to generate response');
      return '⚠️ El asistente IA no está disponible. Asegúrate de que Ollama esté ejecutándose.';
    }
  }

  async classifyIntent(prompt: string, examples: string): Promise<Record<string, unknown> | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt: `${examples}\n\nUsuario: ${prompt}\n\nJSON:`,
          stream: false,
          format: 'json',
          options: {
            temperature: 0,
            top_p: 0.5,
          },
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Ollama responded with ${res.status}: ${text}`);
      }

      const data = await res.json() as { response: string };
      const parsed = JSON.parse(data.response.trim());
      if (parsed && typeof parsed === 'object' && parsed.intent) {
        return parsed;
      }
      return null;
    } catch (error) {
      logger.error({ err: error }, '[Ollama] Failed to classify intent');
      return null;
    }
  }
}
