import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempDbPath = path.join(__dirname, '..', 'prisma', 'temp-schema.db');
const outputPath = path.join(__dirname, '..', 'prisma', 'schema.sql');

try {
  const url = `file:${tempDbPath.replace(/\\/g, '/')}`;
  execSync(`prisma db push --accept-data-loss --url="${url}"`, {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });
} catch (err) {
  console.error('Failed to push schema to temp database:', err.message);
  process.exit(1);
}

const { default: Database } = await import('better-sqlite3');
const db = new Database(tempDbPath);
const rows = db.pragma('table_list');
const schema = [];

for (const row of rows) {
  if (row.name.startsWith('sqlite_')) continue;

  const colInfo = db.pragma(`table_info('${row.name}')`);
  const indexes = db.pragma(`index_list('${row.name}')`);

  const cols = [];
  let primaryKeys = [];

  for (const col of colInfo) {
    let colDef = `  "${col.name}" ${col.type}`;
    if (col.notnull) colDef += ' NOT NULL';
    if (col.dflt_value !== null) colDef += ` DEFAULT ${col.dflt_value}`;
    if (col.pk) primaryKeys.push(col.name);
    cols.push(colDef);
  }

  if (primaryKeys.length > 0) {
    cols.push(`  PRIMARY KEY (${primaryKeys.map(k => `"${k}"`).join(', ')})`);
  }

  schema.push(`CREATE TABLE IF NOT EXISTS "${row.name}" (\n${cols.join(',\n')}\n);`);

  for (const idx of indexes) {
    if (idx.name.startsWith('sqlite_autoindex')) continue;
    const idxInfo = db.pragma(`index_info('${idx.name}')`);
    const idxCols = idxInfo.map(i => `"${i.name}"`);
    const unique = idx.unique ? 'UNIQUE ' : '';
    schema.push(`CREATE ${unique}INDEX IF NOT EXISTS "${idx.name}" ON "${row.name}" (${idxCols.join(', ')});`);
  }
}

db.close();
fs.unlinkSync(tempDbPath);
fs.writeFileSync(outputPath, schema.join('\n\n') + '\n');
console.log(`Schema generated: ${outputPath} (${schema.length} statements)`);
