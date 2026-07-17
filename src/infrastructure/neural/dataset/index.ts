import { RAW_DATASET } from './raw.dataset.js';
import { LabeledExample, DatasetSplit } from '../types.js';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

let extraExamples: LabeledExample[] | null = null;

export function addExtraExamples(examples: LabeledExample[]): void {
  extraExamples = examples;
}

export function getRawDataset(): LabeledExample[] {
  if (extraExamples && extraExamples.length > 0) {
    return [...RAW_DATASET, ...extraExamples];
  }

  // Also check for external dataset file
  const extPath = join(process.cwd(), 'src', 'infrastructure', 'neural', 'dataset', 'extra_dataset.json');
  if (existsSync(extPath)) {
    try {
      const external = JSON.parse(readFileSync(extPath, 'utf-8')) as LabeledExample[];
      if (external.length > 0) {
        return [...RAW_DATASET, ...external];
      }
    } catch {
      // ignore
    }
  }

  return RAW_DATASET;
}

export function getDatasetByIntent(intent: string): LabeledExample[] {
  return RAW_DATASET.filter(ex => ex.intent === intent);
}

export function getDatasetStats(): Record<string, number> {
  const stats: Record<string, number> = {};
  RAW_DATASET.forEach(ex => {
    stats[ex.intent] = (stats[ex.intent] || 0) + 1;
  });
  return stats;
}

export function splitDataset(
  data: LabeledExample[],
  trainRatio = 0.7,
  valRatio = 0.15,
): DatasetSplit {
  const shuffled = [...data].sort(() => Math.random() - 0.5);

  const trainEnd = Math.floor(shuffled.length * trainRatio);
  const valEnd = trainEnd + Math.floor(shuffled.length * valRatio);

  return {
    train: shuffled.slice(0, trainEnd),
    val: shuffled.slice(trainEnd, valEnd),
    test: shuffled.slice(valEnd),
  };
}

export function stratifiedSplit(
  data: LabeledExample[],
  trainRatio = 0.7,
  valRatio = 0.15,
): DatasetSplit {
  const grouped: Record<string, LabeledExample[]> = {};
  data.forEach(ex => {
    if (!grouped[ex.intent]) grouped[ex.intent] = [];
    grouped[ex.intent].push(ex);
  });

  const train: LabeledExample[] = [];
  const val: LabeledExample[] = [];
  const test: LabeledExample[] = [];

  for (const intentExamples of Object.values(grouped)) {
    const shuffled = [...intentExamples].sort(() => Math.random() - 0.5);
    const trainEnd = Math.floor(shuffled.length * trainRatio);
    const valEnd = trainEnd + Math.floor(shuffled.length * valRatio);

    train.push(...shuffled.slice(0, trainEnd));
    val.push(...shuffled.slice(trainEnd, valEnd));
    test.push(...shuffled.slice(valEnd));
  }

  return { train, val, test };
}
