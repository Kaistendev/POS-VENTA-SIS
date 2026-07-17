// Sprint 1 - Foundation
export { RAW_DATASET } from './dataset/raw.dataset.js';
export { getRawDataset, getDatasetByIntent, getDatasetStats, splitDataset, stratifiedSplit } from './dataset/index.js';
export { Tokenizer, Preprocessor } from './pipeline/index.js';
export { splitDataset as splitDatasetPipeline, stratifiedSplit as stratifiedSplitPipeline, getSplitStats, shuffleArray } from './pipeline/splitter.js';
export { ResponseCache } from './pipeline/responseCache.js';
export { aiEntityCreationSchema, aiSaleDraftSchema, aiChatInputSchema, aiIntentClassificationSchema } from './validation/index.js';
export { DEFAULT_MODEL_CONFIG } from './models/index.js';
export type { NeuralModelConfig } from './models/index.js';

// Sprint 2 - Neural Network
export { buildModel, buildSequentialModel } from './models/IntentClassifierModel.js';
export { IntentClassifierTrainer } from './models/trainer.js';
export type { TrainResult, EvalMetrics } from './models/trainer.js';
export { IntentClassifierService } from './models/IntentClassifierService.js';
export type { PredictionResult } from './models/IntentClassifierService.js';
export { NeuralOrchestrator } from './orchestrator/neuralOrchestrator.js';
export type { OrchestratorResult, OrchestratorConfig } from './orchestrator/neuralOrchestrator.js';

// Shared types
export {
  INTENT_LABELS,
  INTENT_TO_INDEX,
  INDEX_TO_INTENT,
  DEFAULT_PREPROCESSOR_CONFIG,
} from './types.js';
export type {
  IntentCategory,
  LabeledExample,
  TokenizedExample,
  TrainingExample,
  DatasetSplit,
  Vocabulary,
  PreprocessorConfig,
} from './types.js';
