const PROMPT_INJECTION_PATTERNS = [
  /ignora\s+(las\s+)?instrucciones/i,
  /ignore\s+(the\s+)?(above|instructions|previous)/i,
  /olvida\s+(lo\s+)?(anterior|que\s+te\s+dije)/i,
  /eres\s+un\s+( asistente| chatbot| ai)\s+(diferente|malvado|libre)/i,
  /you\s+are\s+(now|not\s+)\s*(a|an)\s*(free|evil|different)/i,
  /dime\s+(como\s+)?hacer\s+(algo\s+)?(ilegal|malo|peligroso)/i,
  /tell\s+me\s+how\s+to\s+(hack|steal|cheat|bypass)/i,
  /select\s+\*|drop\s+table|delete\s+from|insert\s+into|union\s+select/i,
  /<script|<iframe|<img\s+src|onerror=|onload=/i,
  /[\u0000-\u001F]/, // control characters
];

const MAX_QUERY_LENGTH = 500;
const MAX_WORD_REPEAT = 5;
const SUSPICIOUS_CHARS = /[{}[\]\\]/g;

export interface SanitizationResult {
  sanitized: string;
  isValid: boolean;
  reason?: string;
}

export class InputSanitizer {
  sanitize(input: unknown): SanitizationResult {
    if (typeof input !== 'string') {
      return { sanitized: '', isValid: false, reason: 'Input must be a string' };
    }

    if (input.length === 0) {
      return { sanitized: '', isValid: false, reason: 'Input is empty' };
    }

    if (input.length > MAX_QUERY_LENGTH) {
      return { sanitized: input.substring(0, MAX_QUERY_LENGTH), isValid: false, reason: `Input exceeds max length (${MAX_QUERY_LENGTH})` };
    }

    const hasSuspicious = SUSPICIOUS_CHARS.test(input);
    if (hasSuspicious) {
      return { sanitized: input.replace(SUSPICIOUS_CHARS, ''), isValid: false, reason: 'Input contains suspicious characters' };
    }

    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        return { sanitized: input, isValid: false, reason: 'Potential prompt injection detected' };
      }
    }

    const words = input.split(/\s+/);
    for (const word of words) {
      let count = 0;
      for (const w of words) {
        if (w.toLowerCase() === word.toLowerCase()) count++;
      }
      if (count > MAX_WORD_REPEAT) {
        return { sanitized: input, isValid: false, reason: 'Excessive word repetition detected' };
      }
    }

    return { sanitized: input, isValid: true };
  }

  getInjectionPatterns(): string[] {
    return PROMPT_INJECTION_PATTERNS.map(p => p.source);
  }
}
