import { Tokenizer } from './tokenizer.js';
import { LabeledExample, TokenizedExample, Vocabulary } from '../types.js';

export class Preprocessor {
  private tokenizer: Tokenizer;

  constructor() {
    this.tokenizer = new Tokenizer({
      lowercase: true,
      stripAccents: true,
      removeStopWords: true,
      removePunctuation: true,
      minTokenLength: 2,
    });
  }

  tokenizeExample(example: LabeledExample): TokenizedExample {
    return {
      ...example,
      tokens: this.tokenizer.tokenize(example.query),
    };
  }

  tokenizeBatch(examples: LabeledExample[]): TokenizedExample[] {
    return examples.map(ex => this.tokenizeExample(ex));
  }

  buildVocabulary(
    examples: LabeledExample[],
    minFrequency = 1,
    maxSize = 5000,
  ): Vocabulary {
    const frequency: Record<string, number> = {};

    for (const ex of examples) {
      const tokens = this.tokenizer.tokenize(ex.query);
      for (const token of tokens) {
        frequency[token] = (frequency[token] || 0) + 1;
      }
    }

    const sortedWords = Object.entries(frequency)
      .filter(([_, count]) => count >= minFrequency)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, maxSize);

    const wordToIndex: Record<string, number> = { '<PAD>': 0, '<UNK>': 1, '<START>': 2, '<END>': 3 };
    const indexToWord: string[] = ['<PAD>', '<UNK>', '<START>', '<END>'];

    sortedWords.forEach(([word], idx) => {
      wordToIndex[word] = idx + 4;
      indexToWord.push(word);
    });

    return { wordToIndex, indexToWord, size: indexToWord.length };
  }

  tokensToIndices(
    tokens: string[],
    vocabulary: Vocabulary,
    maxLength: number,
  ): number[] {
    const indices = tokens.map(t => vocabulary.wordToIndex[t] ?? 1);
    if (indices.length > maxLength) {
      return indices.slice(0, maxLength);
    }
    return [...indices, ...Array(maxLength - indices.length).fill(0)];
  }

  exampleToInputVector(
    example: LabeledExample,
    vocabulary: Vocabulary,
    maxLength: number,
  ): number[] {
    const tokens = this.tokenizer.tokenize(example.query);
    return this.tokensToIndices(tokens, vocabulary, maxLength);
  }

  batchToInputVectors(
    examples: LabeledExample[],
    vocabulary: Vocabulary,
    maxLength: number,
  ): number[][] {
    return examples.map(ex => this.exampleToInputVector(ex, vocabulary, maxLength));
  }

  batchToOutputVectors(
    examples: LabeledExample[],
    intentIndexMap: Record<string, number>,
    numClasses: number,
  ): number[][] {
    return examples.map(ex => {
      const vector = Array(numClasses).fill(0);
      const idx = intentIndexMap[ex.intent];
      if (idx !== undefined) {
        vector[idx] = 1;
      }
      return vector;
    });
  }
}
