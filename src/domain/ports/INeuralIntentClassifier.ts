import { IntentCategory, TrainingExample } from '../../infrastructure/neural/types.js';

export interface IIntentClassifier {
  predict(query: string): Promise<{ intent: IntentCategory; confidence: number }>;
  predictBatch(queries: string[]): Promise<Array<{ intent: IntentCategory; confidence: number }>>;
  isModelLoaded(): boolean;
}

export interface INeuralModelTrainer {
  train(examples: TrainingExample[], epochs?: number, batchSize?: number): Promise<{ accuracy: number; loss: number; valAccuracy: number }>;
  saveModel(path: string): Promise<void>;
  loadModel(path: string): Promise<void>;
  getModelInfo(): { inputSize: number; numClasses: number; isTrained: boolean };
}
