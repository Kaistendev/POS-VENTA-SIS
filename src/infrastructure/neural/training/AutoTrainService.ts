import { DatabaseSync } from 'node:sqlite';
import { join } from 'path';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { IntentCategory } from '../types.js';
import type { LabeledExample } from '../types.js';
import { IntentClassifierTrainer } from '../models/trainer.js';
import { addExtraExamples } from '../dataset/index.js';
import { logger } from '../../../shared/logger.js';

interface TrainingExample {
  query: string;
  intent: IntentCategory;
  feedback: number;
  createdAt: string;
}

interface TrainingStats {
  totalLogs: number;
  positiveExamples: number;
  negativeExamples: number;
  lastTrainingDate: string | null;
  retrainAvailable: boolean;
  intentDistribution: Record<string, number>;
}

const INTENT_KEYWORDS: Record<string, RegExp[]> = {
  product_query: [
    /precio|costoso?|caro|barato|cuest(a|e)|sku|costo|costar|valor/i,
    /producto|stock|inventario|existencia|disponible/i,
    /mas\s+caro|mas\s+barato|mas\s+economico/i,
    /categor[ií]a|marca|tipo\s+de\s+producto/i,
  ],
  entity_count: [
    /cu[aá]ntos?\s+(producto|cliente|categoria|proveedor)/i,
    /cu[aá]ntas?\s+(categor[ií]as|ventas|compras)/i,
    /total\s+de\s+(productos|clientes|usuarios)/i,
    /cu[aá]ntos?\s+(hay|tenemos|existen|registrados)/i,
  ],
  entity_creation: [
    /crea(r|r\s*un|r\s*una)?\s+(producto|cliente|nuev)/i,
    /registra(r)?\s+(producto|cliente|nuev)/i,
    /a[ñn]adir\s+(producto|cliente|nuev)/i,
    /nuev[oa]\s+(producto|cliente)/i,
  ],
  data_modification: [
    /modifica(r)?\s+|actualiza(r)?\s+|cambia(r)?\s+/i,
    /edita(r)?\s+/i,
    /quiero\s+(cambiar|modificar|actualizar)/i,
  ],
  data_deletion: [
    /elimina(r)?\s+|borra(r)?\s+|quit(a|ar)\s+/i,
    /eliminaci[oó]n|borrar|suprimir/i,
  ],
  sale_draft: [
    /vend(e|er|o)\s+/i,
    /compra(r)?\s+/i,
    /factura(r)?\s+|carrito|pedido/i,
    /preparar\s+(venta|pedido)/i,
  ],
  sales_summary: [
    /ventas?\s+(de\s+hoy|del\s+d[ií]a|seman|mes|a[ñn]o)/i,
    /ganancia|ingreso|recaudaci[oó]n|resumen\s+de\s+ventas/i,
    /cu[aá]ntas?\s+ventas/i,
    /total\s+(vendido|facturado|recaudado)/i,
    /reporte\s+de\s+ventas|dashboard/i,
  ],
  general: [
    /hola|buenos\s+d[ií]as|gracias|ayuda|qui[eé]n\s+eres/i,
    /funciona|como\s+se\s+usa|tutorial/i,
    /adios|chao|nos\s+vemos/i,
  ],
};

function autoLabel(query: string): IntentCategory {
  const q = query.toLowerCase();

  for (const [intent, patterns] of Object.entries(INTENT_KEYWORDS)) {
    for (const pattern of patterns) {
      if (pattern.test(q)) return intent as IntentCategory;
    }
  }

  return 'general';
}

export class AutoTrainService {
  private trainer: IntentClassifierTrainer;
  private dbPath: string;

  constructor(dbPath?: string) {
    this.trainer = new IntentClassifierTrainer();
    this.dbPath = dbPath || join(process.cwd(), 'dev.sqlite3');
  }

  async collectFromLogs(): Promise<TrainingExample[]> {
    const db = new DatabaseSync(this.dbPath);
    try {
      const rows = db.prepare(`
        SELECT mensaje_usuario, nlu_output, created_at
        FROM ai_training_logs
        ORDER BY created_at DESC
        LIMIT 1000
      `).all() as Array<{ mensaje_usuario: string; nlu_output: string | null; created_at: string }>;

      const examples: TrainingExample[] = [];

      for (const row of rows) {
        let feedback = 0;
        if (row.nlu_output) {
          try {
            const parsed = JSON.parse(row.nlu_output);
            if (parsed.feedback) {
              feedback = parsed.feedback;
            }
          } catch {
            // not JSON, skip
          }
        }

        if (feedback !== 1 && feedback !== -1) continue;

        const intent = autoLabel(row.mensaje_usuario);
        examples.push({
          query: row.mensaje_usuario,
          intent,
          feedback,
          createdAt: row.created_at,
        });
      }

      return examples;
    } finally {
      db.close();
    }
  }

  async retrain(options?: { modelDir?: string; epochs?: number }): Promise<{ success: boolean; accuracy?: number; message: string }> {
    try {
      const examples = await this.collectFromLogs();
      const positiveExamples = examples.filter(e => e.feedback === 1);

      if (positiveExamples.length < 5) {
        return { success: false, message: `Solo ${positiveExamples.length} ejemplos positivos. Se necesitan al menos 5 para reentrenar.` };
      }

      const augmentedData = augmentDataset(positiveExamples);
      const extraLabeled: LabeledExample[] = augmentedData.map((a, i) => ({
        id: `user_${Date.now()}_${i}`,
        query: a.query,
        intent: a.intent,
      }));

      addExtraExamples(extraLabeled);

      const modelDir = options?.modelDir || join(process.cwd(), 'src', 'infrastructure', 'neural', 'models', 'model');
      const epochs = options?.epochs || 100;

      if (!existsSync(modelDir)) {
        mkdirSync(modelDir, { recursive: true });
      }

      const result = await this.trainer.trainAndSave(modelDir, undefined, epochs);

      const acc = result.metrics?.accuracy ?? 0;
      logger.info({ accuracy: acc, examples: positiveExamples.length }, 'Model retrained successfully');

      const augPath = join(modelDir, 'augmentation.json');
      writeFileSync(augPath, JSON.stringify({
        augmentedAt: new Date().toISOString(),
        sourceExamples: positiveExamples.length,
        augmentedExamples: augmentedData.length,
        testAccuracy: acc,
      }, null, 2));

      return {
        success: true,
        accuracy: acc,
        message: `Modelo reentrenado con ${positiveExamples.length} nuevos ejemplos. Accuracy: ${(acc * 100).toFixed(1)}%`,
      };
    } catch (err: any) {
      logger.error({ err }, 'Auto-retrain failed');
      return { success: false, message: `Error al reentrenar: ${err.message}` };
    }
  }

  async getStats(): Promise<TrainingStats> {
    const examples = await this.collectFromLogs();
    const positive = examples.filter(e => e.feedback === 1);
    const negative = examples.filter(e => e.feedback === -1);

    const distribution: Record<string, number> = {};
    for (const ex of examples) {
      distribution[ex.intent] = (distribution[ex.intent] || 0) + 1;
    }

    let lastTrainingDate: string | null = null;
    const modelDir = join(process.cwd(), 'src', 'infrastructure', 'neural', 'models', 'model');
    const metaPath = join(modelDir, 'metadata.json');
    if (existsSync(metaPath)) {
      try {
        const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
        lastTrainingDate = meta.trainingDate || null;
      } catch {
        // ignore
      }
    }

    return {
      totalLogs: examples.length,
      positiveExamples: positive.length,
      negativeExamples: negative.length,
      lastTrainingDate,
      retrainAvailable: positive.length >= 5,
      intentDistribution: distribution,
    };
  }

  getAutoLabeledExamples(): Array<{ query: string; intent: IntentCategory }> {
    const db = new DatabaseSync(this.dbPath);
    try {
      const rows = db.prepare(`
        SELECT mensaje_usuario FROM ai_training_logs
        ORDER BY created_at DESC
        LIMIT 500
      `).all() as Array<{ mensaje_usuario: string }>;

      return rows.map(r => ({
        query: r.mensaje_usuario,
        intent: autoLabel(r.mensaje_usuario),
      }));
    } finally {
      db.close();
    }
  }
}

function augmentDataset(examples: TrainingExample[]): Array<{ query: string; intent: IntentCategory }> {
  const augmented: Array<{ query: string; intent: IntentCategory }> = [];
  const seen = new Set<string>();

  for (const ex of examples) {
    const key = ex.query.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);

    augmented.push({ query: ex.query, intent: ex.intent });

    // Generate simple variations
    const q = ex.query;
    if (q.endsWith('?')) {
      augmented.push({ query: q.slice(0, -1), intent: ex.intent });
    }
    if (!q.endsWith('?')) {
      augmented.push({ query: q + '?', intent: ex.intent });
    }
    if (q.startsWith('cual ')) {
      augmented.push({ query: q.replace('cual ', 'cuál '), intent: ex.intent });
    }
  }

  return augmented;
}
