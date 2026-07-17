const SPANISH_STOP_WORDS = new Set([
  'un', 'una', 'unas', 'unos', 'uno', 'el', 'la', 'los', 'las',
  'de', 'del', 'en', 'con', 'por', 'para', 'y', 'e', 'o', 'a',
  'su', 'que', 'es', 'se', 'no', 'lo', 'como', 'más', 'mas',
  'pero', 'sus', 'le', 'ya', 'este', 'entre', 'porque', 'cuando',
  'muy', 'sin', 'sobre', 'también', 'tambien', 'me', 'mi', 'tu',
  'te', 'si', 'nos', 'les', 'hay', 'cual', 'cuales', 'dime',
  'busca', 'encuentra', 'saber', 'puedes', 'podrias', 'quiero',
  'necesito', 'está', 'esta', 'estas', 'están', 'estan', 'todo',
  'toda', 'todos', 'todas', 'algo', 'nada', 'siempre', 'nunca',
]);

const ACCENT_MAP: Record<string, string> = {
  'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
  'ü': 'u', 'ñ': 'ñ',
  'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
  'Ü': 'U', 'Ñ': 'Ñ',
};

const PUNCTUATION_REGEX = /[¿?¡!.,;:()\-"'«»]/g;
const NON_ALPHA_REGEX = /[^a-záéíóúüña-z0-9\s]/g;

export interface TokenizerOptions {
  lowercase?: boolean;
  stripAccents?: boolean;
  removeStopWords?: boolean;
  removePunctuation?: boolean;
  minTokenLength?: number;
}

export class Tokenizer {
  private options: Required<TokenizerOptions>;

  constructor(options: TokenizerOptions = {}) {
    this.options = {
      lowercase: options.lowercase ?? true,
      stripAccents: options.stripAccents ?? true,
      removeStopWords: options.removeStopWords ?? true,
      removePunctuation: options.removePunctuation ?? true,
      minTokenLength: options.minTokenLength ?? 2,
    };
  }

  clean(text: string): string {
    let result = text;

    if (this.options.removePunctuation) {
      result = result.replace(PUNCTUATION_REGEX, ' ');
    }

    if (this.options.lowercase) {
      result = result.toLowerCase();
    }

    if (this.options.stripAccents) {
      result = result.replace(/[áéíóúüñ]/g, ch => ACCENT_MAP[ch] || ch);
    }

    result = result.replace(NON_ALPHA_REGEX, ' ');
    result = result.replace(/\s+/g, ' ').trim();

    return result;
  }

  tokenize(text: string): string[] {
    const cleaned = this.clean(text);
    const tokens = cleaned.split(/\s+/).filter(t => t.length >= this.options.minTokenLength);

    if (this.options.removeStopWords) {
      return tokens.filter(t => !SPANISH_STOP_WORDS.has(t));
    }

    return tokens;
  }

  tokenizeWithPositions(text: string): Array<{ token: string; start: number; end: number }> {
    const cleaned = this.clean(text);
    const regex = /\S+/g;
    const result: Array<{ token: string; start: number; end: number }> = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(cleaned)) !== null) {
      const token = match[0].toLowerCase();
      if (this.options.removeStopWords && SPANISH_STOP_WORDS.has(token)) continue;
      if (token.length < this.options.minTokenLength) continue;
      result.push({ token, start: match.index, end: match.index + token.length });
    }

    return result;
  }
}
