#!/usr/bin/env node
/**
 * Sprint 6.1 - Pruebas de carga/estrés (RN + Phi3 simultáneo)
 *
 * Uso: node tests/load-test-ai.js [concurrency] [totalQueries]
 *
 * Ejemplo:
 *   node tests/load-test-ai.js 10 100   # 10 conc, 100 queries
 *   node tests/load-test-ai.js 50 500   # 50 conc, 500 queries
 */

const BASE_URL = process.env.AI_API_URL || 'http://localhost:11434';

const TEST_QUERIES = [
  'cuántos productos hay en stock',
  'cuál es el producto más caro',
  'resumen de ventas de hoy',
  'cuántos clientes tenemos registrados',
  'qué productos tienen bajo stock',
  'mostrar las ventas de la semana',
  'cuál fue la ganancia del mes',
  'buscar producto con sku PRO-001',
  'cuántas categorías existen',
  'cuál es el producto más vendido',
];

function generateQuery(batch) {
  const idx = batch % TEST_QUERIES.length;
  const variation = Math.random() > 0.7 ? '?' : '';
  return TEST_QUERIES[idx] + variation;
}

async function testSingleQuery(query, id) {
  const start = Date.now();
  let status = 'ok';
  let errMsg = '';
  try {
    const resp = await fetch(`${BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'phi3:latest',
        prompt: query,
        stream: false,
        options: { temperature: 0.1, num_predict: 64 },
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!resp.ok) {
      status = 'fail';
      errMsg = `HTTP ${resp.status}`;
    }
    await resp.text();
  } catch (err) {
    status = 'fail';
    errMsg = err.message;
  }
  const elapsed = Date.now() - start;
  return { id, query, status, elapsed, errMsg };
}

async function runLoadTest(concurrency, total) {
  console.log(`\n=== AI LOAD TEST ===`);
  console.log(`Concurrency: ${concurrency}, Total queries: ${total}`);
  console.log(`URL: ${BASE_URL}\n`);

  const allResults = [];
  let completed = 0;
  let active = 0;
  let queuePointer = 0;

  const startTime = Date.now();

  return new Promise((resolve) => {
    function launchNext() {
      while (active < concurrency && queuePointer < total) {
        const id = queuePointer++;
        const query = generateQuery(id);
        active++;
        testSingleQuery(query, id).then(result => {
          active--;
          completed++;
          allResults.push(result);
          if (completed % 10 === 0 || completed === total) {
            const pct = ((completed / total) * 100).toFixed(0);
            process.stdout.write(`\r  Progress: ${completed}/${total} (${pct}%) - Active: ${active}`);
          }
          if (completed === total) {
            resolve(allResults);
          } else {
            launchNext();
          }
        });
      }
    }
    launchNext();
  }).then(results => {
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    const successful = results.filter(r => r.status === 'ok');
    const failed = results.filter(r => r.status === 'fail');
    const latencies = successful.map(r => r.elapsed);
    const avgLatency = latencies.length ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(0) : 'N/A';
    const maxLatency = latencies.length ? Math.max(...latencies) : 0;
    const minLatency = latencies.length ? Math.min(...latencies) : 0;
    const qps = totalTime > 0 ? (total / parseFloat(totalTime)).toFixed(1) : 'N/A';

    console.log(`\n\n=== RESULTS ===`);
    console.log(`  Total time:     ${totalTime}s`);
    console.log(`  Throughput:     ${qps} qps`);
    console.log(`  Successful:     ${successful.length}`);
    console.log(`  Failed:         ${failed.length}`);
    console.log(`  Avg latency:    ${avgLatency}ms`);
    console.log(`  Min latency:    ${minLatency}ms`);
    console.log(`  Max latency:    ${maxLatency}ms`);

    if (failed.length > 0) {
      console.log(`\n  Failed queries (first 5):`);
      failed.slice(0, 5).forEach(f => console.log(`    #${f.id}: ${f.errMsg}`));
    }

    const p50 = sortedPercentile(latencies, 50);
    const p95 = sortedPercentile(latencies, 95);
    const p99 = sortedPercentile(latencies, 99);
    console.log(`\n  Percentiles:`);
    console.log(`    P50:  ${p50}ms`);
    console.log(`    P95:  ${p95}ms`);
    console.log(`    P99:  ${p99}ms`);

    const successRate = total > 0 ? ((successful.length / total) * 100).toFixed(1) : 'N/A';
    console.log(`\n  Success rate:   ${successRate}%`);
    console.log(`  Status:         ${failed.length === 0 ? '✅ PASS' : failed.length > total * 0.1 ? '❌ FAIL ( >10% errors)' : '⚠️ WARN (<10% errors)'}`);
    console.log();
  });
}

function sortedPercentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

const concurrency = parseInt(process.argv[2], 10) || 10;
const total = parseInt(process.argv[3], 10) || 100;
runLoadTest(concurrency, total);
