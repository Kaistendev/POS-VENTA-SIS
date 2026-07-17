import { LabeledExample, DatasetSplit } from '../types.js';

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function splitDataset(
  data: LabeledExample[],
  trainRatio = 0.7,
  valRatio = 0.15,
): DatasetSplit {
  const shuffled = shuffleArray(data);
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
    const shuffled = shuffleArray(intentExamples);
    const trainEnd = Math.floor(shuffled.length * trainRatio);
    const valEnd = trainEnd + Math.floor(shuffled.length * valRatio);

    train.push(...shuffled.slice(0, trainEnd));
    val.push(...shuffled.slice(trainEnd, valEnd));
    test.push(...shuffled.slice(valEnd));
  }

  return { train, val, test };
}

export function getSplitStats(split: DatasetSplit): Record<string, Record<string, number>> {
  const count = (examples: LabeledExample[], _label: string): Record<string, number> => {
    const stats: Record<string, number> = {};
    for (const ex of examples) {
      stats[ex.intent] = (stats[ex.intent] || 0) + 1;
    }
    stats['_total'] = examples.length;
    return stats;
  };

  return {
    train: count(split.train, 'train'),
    val: count(split.val, 'val'),
    test: count(split.test, 'test'),
  };
}
