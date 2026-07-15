export interface IAiProvider {
  generateResponse(prompt: string, systemContext: string): Promise<string>;
  classifyIntent(prompt: string, examples: string): Promise<Record<string, unknown> | null>;
}
