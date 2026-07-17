export type IntentCategory =
  | 'product_query'
  | 'entity_count'
  | 'entity_creation'
  | 'data_modification'
  | 'data_deletion'
  | 'sale_draft'
  | 'sales_summary'
  | 'general';

export const INTENT_LABELS: IntentCategory[] = [
  'product_query',
  'entity_count',
  'entity_creation',
  'data_modification',
  'data_deletion',
  'sale_draft',
  'sales_summary',
  'general',
];

export const INTENT_TO_INDEX: Record<IntentCategory, number> = {
  product_query: 0,
  entity_count: 1,
  entity_creation: 2,
  data_modification: 3,
  data_deletion: 4,
  sale_draft: 5,
  sales_summary: 6,
  general: 7,
};

export const INDEX_TO_INTENT: Record<number, IntentCategory> = {
  0: 'product_query',
  1: 'entity_count',
  2: 'entity_creation',
  3: 'data_modification',
  4: 'data_deletion',
  5: 'sale_draft',
  6: 'sales_summary',
  7: 'general',
};

export interface LabeledExample {
  id: string;
  query: string;
  intent: IntentCategory;
  entities?: Record<string, unknown>;
  tokens?: string[];
}

export interface TokenizedExample extends LabeledExample {
  tokens: string[];
}

export interface TrainingExample {
  query: string;
  intentIndex: number;
  tokens: string[];
}

export interface DatasetSplit {
  train: LabeledExample[];
  val: LabeledExample[];
  test: LabeledExample[];
}

export interface Vocabulary {
  wordToIndex: Record<string, number>;
  indexToWord: string[];
  size: number;
}

export interface PreprocessorConfig {
  maxLength: number;
  vocabulary: Vocabulary;
  stripAccents: boolean;
  lowercase: boolean;
  removeStopWords: boolean;
  removePunctuation: boolean;
}

export const DEFAULT_PREPROCESSOR_CONFIG: PreprocessorConfig = {
  maxLength: 50,
  stripAccents: true,
  lowercase: true,
  removeStopWords: true,
  removePunctuation: true,
  vocabulary: { wordToIndex: {}, indexToWord: [], size: 0 },
};
