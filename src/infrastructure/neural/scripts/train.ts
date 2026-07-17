import { IntentClassifierTrainer } from '../models/trainer.js';
import { DEFAULT_MODEL_CONFIG } from '../models/index.js';
import { logger } from '../../../shared/logger.js';
import { getDatasetStats } from '../dataset/index.js';

async function main() {
  const modelDir = process.argv[2] || './neural_model';
  const epochs = parseInt(process.argv[3] ?? '200', 10);

  logger.info('=== Intent Classifier Training ===');

  const trainer = new IntentClassifierTrainer();
  const data = trainer.prepareData();
  logger.info({ stats: data.train.length, val: data.val.length, test: data.test.length, vocab: data.vocabulary.size }, 'Dataset stats');

  const { result, metrics } = await trainer.trainAndSave(modelDir, {}, epochs);

  console.log('\n=== Training Results ===');
  console.log(`  Accuracy:    ${(result.accuracy * 100).toFixed(2)}%`);
  console.log(`  Loss:        ${result.loss.toFixed(4)}`);
  console.log(`  Val Accuracy: ${(result.valAccuracy * 100).toFixed(2)}%`);
  console.log(`  Val Loss:     ${result.valLoss.toFixed(4)}`);
  console.log(`  Vocabulary:  ${result.vocabulary.size} words`);

  if (metrics) {
    console.log('\n=== Evaluation ===');
    console.log(`  Accuracy:  ${(metrics.accuracy * 100).toFixed(2)}%`);
    console.log(`  Precision: ${(metrics.precision * 100).toFixed(2)}%`);
    console.log(`  Recall:    ${(metrics.recall * 100).toFixed(2)}%`);
    console.log(`  F1 Score:  ${(metrics.f1Score * 100).toFixed(2)}%`);

    console.log('\n=== Per-Intent Metrics ===');
    for (const [intent, m] of Object.entries(metrics.perIntentMetrics)) {
      console.log(`  ${intent.padEnd(20)} P:${(m.precision * 100).toFixed(1).padStart(5)}% R:${(m.recall * 100).toFixed(1).padStart(5)}% F1:${(m.f1 * 100).toFixed(1).padStart(5)}%`);
    }

    console.log('\n=== Confusion Matrix ===');
    const header = metrics.confusionMatrix.map((_, i) => String(i).padStart(5)).join(' ');
    console.log(`       ${header}`);
    metrics.confusionMatrix.forEach((row, i) => {
      const rowStr = row.map(v => String(v).padStart(5)).join(' ');
      console.log(`  [${i}] ${rowStr}`);
    });
  }

  logger.info({ modelDir }, 'Training complete');
}

main().catch(err => {
  console.error('Training failed:', err);
  process.exit(1);
});
