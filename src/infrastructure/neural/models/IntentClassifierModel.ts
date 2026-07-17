import * as tf from '@tensorflow/tfjs';
import { DEFAULT_MODEL_CONFIG, NeuralModelConfig } from './index.js';

export function buildModel(config: Partial<NeuralModelConfig> = {}): tf.LayersModel {
  const cfg = { ...DEFAULT_MODEL_CONFIG, ...config };

  const input = tf.input({ shape: [cfg.maxSequenceLength], dtype: 'int32', name: 'input' });

  const embedding = tf.layers.embedding({
    inputDim: cfg.inputSize,
    outputDim: cfg.embeddingSize,
    inputLength: cfg.maxSequenceLength,
    maskZero: true,
    name: 'embedding',
  }).apply(input) as tf.SymbolicTensor;

  const globalPool = tf.layers.globalAveragePooling1d({ name: 'global_avg_pool' }).apply(embedding) as tf.SymbolicTensor;

  const dense1 = tf.layers.dense({
    units: cfg.hiddenSize,
    activation: 'relu',
    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
    name: 'dense_1',
  }).apply(globalPool) as tf.SymbolicTensor;

  const dropout1 = tf.layers.dropout({ rate: cfg.dropoutRate, name: 'dropout_1' }).apply(dense1) as tf.SymbolicTensor;

  const dense2 = tf.layers.dense({
    units: Math.floor(cfg.hiddenSize / 2),
    activation: 'relu',
    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
    name: 'dense_2',
  }).apply(dropout1) as tf.SymbolicTensor;

  const dropout2 = tf.layers.dropout({ rate: cfg.dropoutRate * 0.66, name: 'dropout_2' }).apply(dense2) as tf.SymbolicTensor;

  const output = tf.layers.dense({
    units: cfg.numClasses,
    activation: 'softmax',
    name: 'output',
  }).apply(dropout2) as tf.SymbolicTensor;

  const model = tf.model({ inputs: input, outputs: output, name: 'intent_classifier' });

  model.compile({
    optimizer: tf.train.adam(cfg.learningRate),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });

  return model;
}

export function buildSequentialModel(config: Partial<NeuralModelConfig> = {}): tf.Sequential {
  const cfg = { ...DEFAULT_MODEL_CONFIG, ...config };

  const model = tf.sequential({ name: 'intent_classifier_seq' });

  model.add(tf.layers.embedding({
    inputDim: cfg.inputSize,
    outputDim: cfg.embeddingSize,
    inputLength: cfg.maxSequenceLength,
    maskZero: true,
  }));

  model.add(tf.layers.globalAveragePooling1d());

  model.add(tf.layers.dense({
    units: cfg.hiddenSize,
    activation: 'relu',
  }));

  model.add(tf.layers.dropout({ rate: cfg.dropoutRate }));

  model.add(tf.layers.dense({
    units: Math.floor(cfg.hiddenSize / 2),
    activation: 'relu',
  }));

  model.add(tf.layers.dropout({ rate: cfg.dropoutRate * 0.5 }));

  model.add(tf.layers.dense({
    units: cfg.numClasses,
    activation: 'softmax',
  }));

  model.compile({
    optimizer: tf.train.adam(cfg.learningRate),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });

  return model;
}
