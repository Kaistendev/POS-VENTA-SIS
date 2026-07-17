import * as tf from '@tensorflow/tfjs';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export async function saveModelToFileSystem(
  model: tf.LayersModel,
  dir: string,
): Promise<void> {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  await model.save(tf.io.withSaveHandler(async modelArtifacts => {
    const modelJSON = JSON.stringify({
      modelTopology: modelArtifacts.modelTopology,
      weightsManifest: modelArtifacts.weightSpecs,
      format: 'tfjs-layers',
      generatedBy: 'pos-venta-sis-nn',
      convertedAt: new Date().toISOString(),
    });

    writeFileSync(join(dir, 'model.json'), modelJSON, 'utf-8');

    const weightSpecs = modelArtifacts.weightSpecs ?? [];
    const wd = modelArtifacts.weightData as unknown as ArrayBuffer;
    const view = new Uint8Array(wd);

    let offset = 0;
    for (let i = 0; i < weightSpecs.length; i++) {
      const spec = weightSpecs[i];
      const name = spec.name.replace(/\//g, '_');
      const size = spec.shape.reduce((a: number, b: number) => a * b, 1);
      const chunk = view.slice(offset, offset + size * 4);
      writeFileSync(join(dir, `${name}.bin`), Buffer.from(chunk));
      offset += size * 4;
    }

    const weightsManifest = weightSpecs.map(spec => ({
      ...spec,
      paths: [`${spec.name.replace(/\//g, '_')}.bin`],
    }));

    writeFileSync(join(dir, 'weights_manifest.json'), JSON.stringify(weightsManifest, null, 2));

    return {
      modelArtifactsInfo: {
        dateSaved: new Date(),
        modelTopologyType: 'JSON',
        modelTopologyBytes: new Blob([modelJSON]).size,
        weightSpecsBytes: new Blob([JSON.stringify(weightSpecs)]).size,
        weightDataBytes: view.byteLength,
      },
    };
  }));
}

export async function loadModelFromFileSystem(dir: string): Promise<tf.LayersModel> {
  const modelPath = join(dir, 'model.json');
  if (!existsSync(modelPath)) {
    throw new Error(`Model not found at ${dir}`);
  }

  const parsed = JSON.parse(readFileSync(modelPath, 'utf-8'));

  const weightSpecsPath = join(dir, 'weights_manifest.json');
  const weightSpecs = existsSync(weightSpecsPath)
    ? JSON.parse(readFileSync(weightSpecsPath, 'utf-8'))
    : (parsed.weightsManifest ?? []);

  const chunks: ArrayBuffer[] = [];

  for (const spec of weightSpecs) {
    const paths: string[] = spec.paths ?? [`${spec.name.replace(/\//g, '_')}.bin`];
    for (const weightPath of paths) {
      const fullPath = join(dir, weightPath);
      if (existsSync(fullPath)) {
        const buf = readFileSync(fullPath);
        chunks.push(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
      }
    }
  }

  const totalBytes = chunks.reduce((sum, b) => sum + b.byteLength, 0);
  const weightData = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    weightData.set(new Uint8Array(chunk), offset);
    offset += chunk.byteLength;
  }

  const modelArtifacts: tf.io.ModelArtifacts = {
    modelTopology: parsed.modelTopology,
    weightSpecs: weightSpecs.map((s: Record<string, unknown>) => ({
      name: s.name as string,
      shape: s.shape as number[],
      dtype: (s.dtype as tf.DataType) ?? 'float32' as tf.DataType,
    })),
    weightData: weightData as unknown as ArrayBuffer,
    format: 'tfjs-layers',
    generatedBy: 'pos-venta-sis-nn',
  };

  return tf.loadLayersModel(tf.io.fromMemory(modelArtifacts));
}
