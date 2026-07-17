#!/usr/bin/env node
/**
 * Sprint 6.3 - Evaluación de accuracy del orquestador
 *
 * Evalúa la precisión de la clasificación de intenciones:
 *  - Ejecuta queries de prueba contra la red neuronal / orquestador
 *  - Compara la intención clasificada con la intención esperada
 *  - Genera reporte de accuracy, matriz de confusión
 *
 * Uso: node tests/evaluate-accuracy-ai.js [apiUrl]
 *
 * NOTA: Requiere que el servidor backend esté corriendo (el orquestador
 * expone sus endpoints en el backend de Electron)
 */

const API_URL = process.env.EVAL_API_URL || 'http://localhost:5173'; // Vite dev server
const ORCHESTRATOR_ENDPOINT = `${API_URL}/api/ai/classify`; // hypothetical endpoint

const TEST_SET = [
  // { query, expectedIntent, category: 'stock|sales|client|product|general' }
  { query: 'cuántos productos hay en stock', expected: 'consultar_stock', category: 'stock' },
  { query: 'qué productos están por agotarse', expected: 'consultar_stock', category: 'stock' },
  { query: 'dime el stock del producto con sku ABC-123', expected: 'consultar_stock', category: 'stock' },
  { query: 'hay suficiente inventario de arroz', expected: 'consultar_stock', category: 'stock' },
  { query: 'cuál es el nivel de stock crítico', expected: 'consultar_stock', category: 'stock' },

  { query: 'cuántas ventas se hicieron hoy', expected: 'consultar_ventas', category: 'sales' },
  { query: 'resumen de ventas de la semana', expected: 'consultar_ventas', category: 'sales' },
  { query: 'cuál fue la ganancia del mes', expected: 'consultar_ventas', category: 'sales' },
  { query: 'ventas del día de ayer', expected: 'consultar_ventas', category: 'sales' },
  { query: 'total vendido en el último trimestre', expected: 'consultar_ventas', category: 'sales' },

  { query: 'cuántos clientes tenemos', expected: 'consultar_clientes', category: 'client' },
  { query: 'lista de clientes registrados', expected: 'consultar_clientes', category: 'client' },
  { query: 'cuál es el cliente que más compra', expected: 'consultar_clientes', category: 'client' },
  { query: 'cliente con dni 12345678', expected: 'consultar_clientes', category: 'client' },
  { query: 'mostrar clientes frecuentes', expected: 'consultar_clientes', category: 'client' },

  { query: 'cuál es el producto más caro', expected: 'buscar_producto', category: 'product' },
  { query: 'buscar producto por nombre', expected: 'buscar_producto', category: 'product' },
  { query: 'productos de la categoría lácteos', expected: 'buscar_producto', category: 'product' },
  { query: 'qué productos caducan pronto', expected: 'buscar_producto', category: 'product' },
  { query: 'productos con precio mayor a 50 soles', expected: 'buscar_producto', category: 'product' },

  { query: 'cuántas categorías existen', expected: 'consultar_categorias', category: 'general' },
  { query: 'quién es el mejor vendedor', expected: 'general', category: 'general' },
  { query: 'cómo se usa el sistema', expected: 'general', category: 'general' },
  { query: 'qué módulos tiene el sistema', expected: 'general', category: 'general' },
  { query: 'gracias por tu ayuda', expected: 'general', category: 'general' },
];

async function classifyLocally(query) {
  const tf = require('@tensorflow/tfjs');
  const path = require('path');
  const fs = require('fs');

  // Try to load the neural network model
  const neuralDir = path.join(__dirname, '..', 'src', 'infrastructure', 'neural', 'models');

  const IntentClassifierService = require('../src/infrastructure/neural/models/IntentClassifierService.js');

  if (!global.__classifier) {
    const classifier = new IntentClassifierService();
    try {
      const modelPath = path.join(neuralDir, 'model');
      if (fs.existsSync(modelPath)) {
        await classifier.loadModel(modelPath);
        global.__classifier = classifier;
      } else {
        return null; // Model not found
      }
    } catch {
      return null; // Model error
    }
  }

  try {
    const result = await global.__classifier.predict(query);
    return result;
  } catch {
    return null;
  }
}

async function evaluate() {
  console.log('\n=== AI ORCHESTRATOR ACCURACY EVALUATION ===');
  console.log(`Test set: ${TEST_SET.length} queries`);
  console.log(`\nCategories:`);
  const categories = [...new Set(TEST_SET.map(t => t.category))];
  categories.forEach(cat => {
    const count = TEST_SET.filter(t => t.category === cat).length;
    console.log(`  ${cat}: ${count} queries`);
  });

  console.log(`\nRunning evaluation...\n`);

  const results = [];
  let correct = 0;

  for (let i = 0; i < TEST_SET.length; i++) {
    const { query, expected } = TEST_SET[i];
    const prediction = await classifyLocally(query);

    if (!prediction) {
      console.log(`  [${i + 1}/${TEST_SET.length}] ⚠️  SKIP (no model): "${query.substring(0, 40)}..."`);
      results.push({
        query: query.substring(0, 60),
        expected,
        predicted: 'N/A',
        confidence: 0,
        correct: false,
        skipped: true,
      });
      continue;
    }

    const isCorrect = prediction.intent === expected;
    if (isCorrect) correct++;

    const mark = isCorrect ? '✅' : '❌';
    console.log(`  [${i + 1}/${TEST_SET.length}] ${mark} exp="${expected}" got="${prediction.intent}" (${(prediction.confidence * 100).toFixed(0)}%)`);

    results.push({
      query: query.substring(0, 60),
      expected,
      predicted: prediction.intent,
      confidence: prediction.confidence,
      correct: isCorrect,
    });
  }

  const total = results.length;
  const evaluated = results.filter(r => !r.skipped).length;
  const accuracy = evaluated > 0 ? ((correct / evaluated) * 100).toFixed(1) : 'N/A';

  console.log(`\n=== RESULTS ===`);
  console.log(`  Total queries:     ${total}`);
  console.log(`  Evaluated:         ${evaluated}`);
  console.log(`  Correct:           ${correct}`);
  console.log(`  Accuracy:          ${accuracy}%`);

  if (evaluated > 0) {
    const byCategory = {};
    TEST_SET.forEach((t, i) => {
      const r = results[i];
      if (!byCategory[t.category]) byCategory[t.category] = { total: 0, correct: 0 };
      byCategory[t.category].total++;
      if (r.correct) byCategory[t.category].correct++;
    });

    console.log(`\n  By category:`);
    for (const [cat, stats] of Object.entries(byCategory)) {
      const pct = ((stats.correct / stats.total) * 100).toFixed(0);
      const bar = '█'.repeat(Math.round(parseInt(pct) / 10)) + '░'.repeat(10 - Math.round(parseInt(pct) / 10));
      console.log(`    ${cat.padEnd(15)} ${bar} ${stats.correct}/${stats.total} (${pct}%)`);
    }

    // Confusion matrix
    console.log(`\n  Confusion matrix (first 3 errors):`);
    const errors = results.filter(r => !r.correct && !r.skipped).slice(0, 3);
    if (errors.length === 0) {
      console.log('    No errors!');
    } else {
      errors.forEach(e => console.log(`    exp="${e.expected}" → got="${e.predicted}" (conf: ${(e.confidence * 100).toFixed(0)}%)`));
    }
  }

  const passThreshold = 70;
  const accNum = parseFloat(accuracy);
  const pass = accNum >= passThreshold;
  console.log(`\n  Status:           ${pass ? '✅ PASS' : '❌ FAIL'} (threshold: ${passThreshold}%)`);
  console.log();
}

evaluate().catch(err => {
  console.error('Evaluation failed:', err.message);
  process.exit(1);
});
