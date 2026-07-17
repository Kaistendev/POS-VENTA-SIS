import * as tf from '@tensorflow/tfjs';
import { Preprocessor } from '../pipeline/preprocessor.js';
import { Vocabulary, IntentCategory, INDEX_TO_INTENT } from '../types.js';
import { DEFAULT_MODEL_CONFIG } from './index.js';
import type { NeuralModelConfig } from './index.js';
import { logger } from '../../../shared/logger.js';
import { loadModelFromFileSystem } from './tfjsIO.js';

export interface PredictionResult {
  intent: IntentCategory;
  confidence: number;
  allProbabilities: Record<string, number>;
  latencyMs: number;
}

interface ModelMetadata {
  vocabulary: {
    wordToIndex: Record<string, number>;
    indexToWord: string[];
    size: number;
  };
  config: NeuralModelConfig;
  intents: Array<{ name: string; index: number }>;
}

export class IntentClassifierService {
  private model: tf.LayersModel | null = null;
  private vocabulary: Vocabulary | null = null;
  private config: NeuralModelConfig = DEFAULT_MODEL_CONFIG;
  private preprocessor: Preprocessor;
  private isLoaded = false;

  constructor() {
    this.preprocessor = new Preprocessor();
  }

  async loadModel(modelPath: string): Promise<void> {
    try {
      const { readFileSync, existsSync } = await import('fs');
      const { join } = await import('path');

      const metadataPath = join(modelPath, 'metadata.json');
      if (existsSync(metadataPath)) {
        const metadataRaw = readFileSync(metadataPath, 'utf-8');
        const metadata: ModelMetadata = JSON.parse(metadataRaw);
        this.vocabulary = metadata.vocabulary;
        this.config = { ...DEFAULT_MODEL_CONFIG, ...metadata.config };
      } else {
        logger.warn({ modelPath }, 'Metadata not found, using defaults');
      }

      this.model = await loadModelFromFileSystem(modelPath);
      this.isLoaded = true;
      logger.info({ modelPath, vocabSize: this.vocabulary?.size }, 'Model loaded successfully');
    } catch (error) {
      logger.error({ err: error, modelPath }, 'Failed to load model');
      this.isLoaded = false;
      throw new Error(`No se pudo cargar el modelo de clasificación: ${(error as Error).message}`);
    }
  }

  async loadModelFromUrl(url: string): Promise<void> {
    this.model = await tf.loadLayersModel(url);
    this.isLoaded = true;
    logger.info({ url }, 'Model loaded from URL');
  }

  async predict(input: string): Promise<PredictionResult> {
    const startTime = performance.now();

    if (!this.model || !this.vocabulary) {
      throw new Error('Modelo no cargado. Llama a loadModel() primero.');
    }

    const inputVector = this.preprocessor.exampleToInputVector(
      { id: '', query: input, intent: 'general' },
      this.vocabulary,
      this.config.maxSequenceLength,
    );

    const tensor = tf.tensor2d([inputVector], [1, this.config.maxSequenceLength], 'int32');

    const output = this.model.predict(tensor) as tf.Tensor;
    const probabilities = (await output.array()) as number[][];

    const probs = probabilities[0];
    const maxIndex = probs.indexOf(Math.max(...probs));
    const confidence = probs[maxIndex];

    const allProbabilities: Record<string, number> = {};
    probs.forEach((p, i) => {
      const intentName = INDEX_TO_INTENT[i];
      if (intentName) {
        allProbabilities[intentName] = parseFloat(p.toFixed(4));
      }
    });

    const latencyMs = performance.now() - startTime;

    tf.dispose([tensor, output]);

    return {
      intent: INDEX_TO_INTENT[maxIndex] ?? 'general',
      confidence: parseFloat(confidence.toFixed(4)),
      allProbabilities,
      latencyMs: parseFloat(latencyMs.toFixed(2)),
    };
  }

  async predictBatch(inputs: string[]): Promise<PredictionResult[]> {
    const startTime = performance.now();

    if (!this.model || !this.vocabulary) {
      throw new Error('Modelo no cargado. Llama a loadModel() primero.');
    }

    const inputVectors = inputs.map(input =>
      this.preprocessor.exampleToInputVector(
        { id: '', query: input, intent: 'general' },
        this.vocabulary!,
        this.config.maxSequenceLength,
      ),
    );

    const tensor = tf.tensor2d(inputVectors, [inputs.length, this.config.maxSequenceLength], 'int32');
    const output = this.model.predict(tensor) as tf.Tensor;
    const probabilities = (await output.array()) as number[][];

    const totalLatency = performance.now() - startTime;

    const results: PredictionResult[] = probabilities.map((probs, i) => {
      const maxIndex = probs.indexOf(Math.max(...probs));
      const confidence = probs[maxIndex];

      const allProbabilities: Record<string, number> = {};
      probs.forEach((p, j) => {
        const intentName = INDEX_TO_INTENT[j];
        if (intentName) {
          allProbabilities[intentName] = parseFloat(p.toFixed(4));
        }
      });

      return {
        intent: INDEX_TO_INTENT[maxIndex] ?? 'general',
        confidence: parseFloat(confidence.toFixed(4)),
        allProbabilities,
        latencyMs: parseFloat((totalLatency / inputs.length).toFixed(2)),
      };
    });

    tf.dispose([tensor, output]);
    return results;
  }

  getModelInfo() {
    return {
      isLoaded: this.isLoaded,
      inputSize: this.config.inputSize,
      numClasses: this.config.numClasses,
      maxSequenceLength: this.config.maxSequenceLength,
      vocabSize: this.vocabulary?.size ?? 0,
    };
  }

  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.isLoaded = false;
      this.model = null;
    }
  }
}
