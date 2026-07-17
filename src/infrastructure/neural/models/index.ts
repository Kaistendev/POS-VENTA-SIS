export interface NeuralModelConfig {
  inputSize: number;
  embeddingSize: number;
  hiddenSize: number;
  numClasses: number;
  learningRate: number;
  dropoutRate: number;
  maxSequenceLength: number;
}

export const DEFAULT_MODEL_CONFIG: NeuralModelConfig = {
  inputSize: 5000,
  embeddingSize: 64,
  hiddenSize: 128,
  numClasses: 8,
  learningRate: 0.001,
  dropoutRate: 0.2,
  maxSequenceLength: 50,
};
