import * as tf from '@tensorflow/tfjs';
import { buildSequentialModel } from './IntentClassifierModel.js';
import { DEFAULT_MODEL_CONFIG, NeuralModelConfig } from './index.js';
import { Preprocessor } from '../pipeline/preprocessor.js';
import { stratifiedSplit } from '../pipeline/splitter.js';
import { getRawDataset } from '../dataset/index.js';
import { INTENT_TO_INDEX, INDEX_TO_INTENT, LabeledExample, Vocabulary } from '../types.js';
import { logger } from '../../../shared/logger.js';
import { saveModelToFileSystem } from './tfjsIO.js';

export interface TrainResult {
  accuracy: number;
  loss: number;
  valAccuracy: number;
  valLoss: number;
  history: tf.History;
  vocabulary: Vocabulary;
  config: NeuralModelConfig;
}

export interface EvalMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: number[][];
  perIntentMetrics: Record<string, { precision: number; recall: number; f1: number }>;
}

export class IntentClassifierTrainer {
  private preprocessor: Preprocessor;

  constructor() {
    this.preprocessor = new Preprocessor();
  }

  prepareData(): {
    train: LabeledExample[];
    val: LabeledExample[];
    test: LabeledExample[];
    vocabulary: Vocabulary;
  } {
    const allData = getRawDataset();
    const split = stratifiedSplit(allData, 0.7, 0.15);
    const vocabulary = this.preprocessor.buildVocabulary(split.train, 1, DEFAULT_MODEL_CONFIG.inputSize);

    return {
      train: split.train,
      val: split.val,
      test: split.test,
      vocabulary,
    };
  }

  async train(
    config: Partial<NeuralModelConfig> = {},
    epochs = 200,
    batchSize = 8,
    onEpochEnd?: (epoch: number, logs: tf.Logs) => void,
  ): Promise<TrainResult> {
    const cfg = { ...DEFAULT_MODEL_CONFIG, ...config };

    const { train, val, vocabulary } = this.prepareData();

    cfg.inputSize = vocabulary.size;

    const model = buildSequentialModel(cfg);

    const xTrain = tf.tensor2d(
      this.preprocessor.batchToInputVectors(train, vocabulary, cfg.maxSequenceLength),
      [train.length, cfg.maxSequenceLength],
      'int32',
    );

    const yTrain = tf.tensor2d(
      this.preprocessor.batchToOutputVectors(train, INTENT_TO_INDEX, cfg.numClasses),
      [train.length, cfg.numClasses],
      'float32',
    );

    const xVal = val.length > 0 ? tf.tensor2d(
      this.preprocessor.batchToInputVectors(val, vocabulary, cfg.maxSequenceLength),
      [val.length, cfg.maxSequenceLength],
      'int32',
    ) : null;

    const yVal = val.length > 0 ? tf.tensor2d(
      this.preprocessor.batchToOutputVectors(val, INTENT_TO_INDEX, cfg.numClasses),
      [val.length, cfg.numClasses],
      'float32',
    ) : null;

    const fitCallbacks: tf.Callback[] = [
      tf.callbacks.earlyStopping({
        monitor: 'val_loss',
        patience: 50,
        minDelta: 0.0001,
      }),
    ];

    const fitOptions: tf.ModelFitArgs = {
      epochs,
      batchSize,
      callbacks: fitCallbacks,
      verbose: 1,
    };

    if (xVal && yVal) {
      fitOptions.validationData = [xVal, yVal];
    } else {
      fitOptions.validationSplit = 0.1;
    }

    logger.info({ epochs, batchSize, trainSize: xTrain.shape[0], valSize: xVal?.shape[0] || 0 }, 'Starting model.fit (train method)');

    // Debug: check for NaN in input data
    const xTrainData = await xTrain.array();
    const yTrainData = await yTrain.array();
    const hasNaN = xTrainData.some(row => row.some(v => isNaN(v))) || yTrainData.some(row => row.some(v => isNaN(v)));
    logger.info({ hasNaN, xTrainShape: xTrain.shape, yTrainShape: yTrain.shape, xTrainSample: xTrainData[0]?.slice(0,5), yTrainSample: yTrainData[0] }, 'Input data check (train method)');

    // Check label distribution
    const labelCounts = Array(cfg.numClasses).fill(0);
    for (const row of yTrainData) {
      const idx = row.indexOf(1);
      if (idx >= 0) labelCounts[idx]++;
    }
    logger.info({ labelCounts, intentNames: Object.values(INTENT_TO_INDEX).sort((a,b) => INTENT_TO_INDEX[a] - INTENT_TO_INDEX[b]) }, 'Label distribution');

    let history;
    try {
      history = await model.fit(xTrain, yTrain, fitOptions);
      logger.info({ historyKeys: Object.keys(history.history), historyLoss: history.history.loss, historyLen: history.history.loss?.length }, 'model.fit completed (train method)');
    } catch (err) {
      logger.error({ err: String(err) }, 'model.fit ERROR');
      throw err;
    }

    const result: TrainResult = {
      accuracy: (history.history.acc?.[history.history.acc.length - 1] as number) ?? 0,
      loss: (history.history.loss?.[history.history.loss.length - 1] as number) ?? 0,
      valAccuracy: (history.history.val_acc?.[history.history.val_acc.length - 1] as number) ?? 0,
      valLoss: (history.history.val_loss?.[history.history.val_loss.length - 1] as number) ?? 0,
      history,
      vocabulary,
      config: cfg,
    };

    logger.info({ ...result }, 'Training completed');

    tf.dispose([xTrain, yTrain, xVal, yVal]);
    model.dispose();

    return result;
  }

  async evaluate(
    model: tf.LayersModel,
    test: LabeledExample[],
    vocabulary: Vocabulary,
    config: NeuralModelConfig,
  ): Promise<EvalMetrics> {
    if (test.length === 0) {
      return {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        confusionMatrix: [],
        perIntentMetrics: {},
      };
    }

    const xTest = tf.tensor2d(
      this.preprocessor.batchToInputVectors(test, vocabulary, config.maxSequenceLength),
      [test.length, config.maxSequenceLength],
      'int32',
    );

    const yTest = tf.tensor2d(
      this.preprocessor.batchToOutputVectors(test, INTENT_TO_INDEX, config.numClasses),
      [test.length, config.numClasses],
      'float32',
    );

    const evalResult = await model.evaluate(xTest, yTest, { batchSize: 8 }) as tf.Tensor[];
    const accuracy = (evalResult[1] as tf.Scalar).dataSync()[0];

    const predictions = model.predict(xTest) as tf.Tensor;
    const predData = predictions.arraySync() as number[][];
    const trueData = yTest.arraySync() as number[][];

    const numClasses = config.numClasses;
    const confusionMatrix: number[][] = Array.from({ length: numClasses }, () => Array(numClasses).fill(0));

    for (let i = 0; i < predData.length; i++) {
      const predClass = predData[i].indexOf(Math.max(...predData[i]));
      const trueClass = trueData[i].indexOf(Math.max(...trueData[i]));
      confusionMatrix[trueClass][predClass]++;
    }

    const perIntentMetrics: Record<string, { precision: number; recall: number; f1: number }> = {};
    let totalPrecision = 0;
    let totalRecall = 0;
    let totalF1 = 0;

    for (let i = 0; i < numClasses; i++) {
      const tp = confusionMatrix[i][i];
      const fp = confusionMatrix.reduce((sum, row) => sum + row[i], 0) - tp;
      const fn = confusionMatrix[i].reduce((sum, val) => sum + val, 0) - tp;

      const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
      const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
      const f1 = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

      const intent = INDEX_TO_INTENT[i] ?? `class_${i}`;
      perIntentMetrics[intent] = { precision, recall, f1 };
      totalPrecision += precision;
      totalRecall += recall;
      totalF1 += f1;
    }

    tf.dispose([xTest, yTest, predictions]);

    return {
      accuracy,
      precision: totalPrecision / numClasses,
      recall: totalRecall / numClasses,
      f1Score: totalF1 / numClasses,
      confusionMatrix,
      perIntentMetrics,
    };
  }

async trainAndSave(
    modelPath: string,
    config: Partial<NeuralModelConfig> = {},
    epochs = 200,
  ): Promise<{ result: TrainResult; metrics?: EvalMetrics }> {
    const cfg = { ...DEFAULT_MODEL_CONFIG, ...config };
    const { train, val, test, vocabulary } = this.prepareData();

    cfg.inputSize = vocabulary.size;

    const model = buildSequentialModel(cfg);

    const xTrain = tf.tensor2d(
      this.preprocessor.batchToInputVectors(train, vocabulary, cfg.maxSequenceLength),
      [train.length, cfg.maxSequenceLength],
      'int32',
    );

    const yTrain = tf.tensor2d(
      this.preprocessor.batchToOutputVectors(train, INTENT_TO_INDEX, cfg.numClasses),
      [train.length, cfg.numClasses],
      'float32',
    );

    const xVal = val.length > 0 ? tf.tensor2d(
      this.preprocessor.batchToInputVectors(val, vocabulary, cfg.maxSequenceLength),
      [val.length, cfg.maxSequenceLength],
      'int32',
    ) : null;

    const yVal = val.length > 0 ? tf.tensor2d(
      this.preprocessor.batchToOutputVectors(val, INTENT_TO_INDEX, cfg.numClasses),
      [val.length, cfg.numClasses],
      'float32',
    ) : null;

    const fitCallbacks: tf.Callback[] = [
      tf.callbacks.earlyStopping({
        monitor: 'val_loss',
        patience: 50,
        minDelta: 0.0001,
      }),
    ];

    const fitOptions: tf.ModelFitArgs = {
      epochs,
      batchSize: 32,
      callbacks: fitCallbacks,
      verbose: 1,
    };

    if (xVal && yVal) {
      fitOptions.validationData = [xVal, yVal];
    }

    logger.info({ epochs, batchSize: 32, trainSize: xTrain.shape[0], valSize: xVal?.shape[0] || 0 }, 'Starting model.fit');
    const history = await model.fit(xTrain, yTrain, fitOptions);
    logger.info({ historyKeys: Object.keys(history.history) }, 'model.fit completed');

    const result: TrainResult = {
      accuracy: (history.history.acc?.[history.history.acc.length - 1] as number) ?? 0,
      loss: (history.history.loss?.[history.history.loss.length - 1] as number) ?? 0,
      valAccuracy: (history.history.val_acc?.[history.history.val_acc.length - 1] as number) ?? 0,
      valLoss: (history.history.val_loss?.[history.history.val_loss.length - 1] as number) ?? 0,
      history,
      vocabulary,
      config: cfg,
    };

    await saveModelToFileSystem(model, modelPath);
    logger.info({ modelPath }, 'Model saved');

    const metadata = {
      vocabulary: { wordToIndex: vocabulary.wordToIndex, indexToWord: vocabulary.indexToWord, size: vocabulary.size },
      config: cfg,
      intents: Object.entries(INTENT_TO_INDEX).map(([name, idx]) => ({ name, index: idx })),
    };

    const { writeFileSync } = await import('fs');
    writeFileSync(`${modelPath}/metadata.json`, JSON.stringify(metadata, null, 2));

    logger.info({ modelPath }, 'Metadata saved');

    const metrics = test.length > 0 ? await this.evaluate(model, test, vocabulary, cfg) : undefined;
    if (metrics) {
      logger.info({ metrics }, 'Evaluation completed');
    }

    tf.dispose([xTrain, yTrain]);
    if (xVal) tf.dispose(xVal);
    if (yVal) tf.dispose(yVal);
    model.dispose();

    return { result, metrics };
  }
}
