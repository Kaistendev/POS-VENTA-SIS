import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

/**
 * Split a SQL script into individual statements.
 * Handles multi-line CREATE TABLE, comments, and trailing semicolons.
 */
function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const next = sql[i + 1] || '';

    if (inString) {
      current += ch;
      if (ch === stringChar && sql[i - 1] !== '\\') {
        inString = false;
      }
      continue;
    }

    if (ch === '-' && next === '-') {
      while (i < sql.length && sql[i] !== '\n') i++;
      continue;
    }

    if (ch === '/' && next === '*') {
      i += 2;
      while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) i++;
      i += 2;
      continue;
    }

    if (ch === "'" || ch === '"') {
      inString = true;
      stringChar = ch;
      current += ch;
      continue;
    }

    if (ch === ';') {
      const trimmed = current.trim();
      if (trimmed) {
        statements.push(trimmed);
      }
      current = '';
      continue;
    }

    current += ch;
  }

  const trimmed = current.trim();
  if (trimmed) {
    statements.push(trimmed);
  }

  return statements;
}

/**
 * Locate the schema.sql file.
 */
function findSchemaSql(): string | null {
  const candidates: string[] = [];

  if (app.isPackaged) {
    candidates.push(path.join(process.resourcesPath, 'prisma', 'schema.sql'));
    candidates.push(path.join(process.resourcesPath, 'schema.sql'));
  }

  // Dev path: relative to dist-electron/ (go up to project root)
  try {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    candidates.push(path.join(currentDir, '..', 'prisma', 'schema.sql'));
  } catch { /* ignore */ }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * Check if the database appears to have been initialized
 * by checking for the existence of core tables.
 */
async function isDatabaseInitialized(prisma: any): Promise<boolean> {
  try {
    const result = await prisma.$queryRawUnsafe(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='users'`
    );
    return Array.isArray(result) && result.length > 0;
  } catch {
    return false;
  }
}

/**
 * Run the full schema DDL against the database.
 * Creates all tables, indexes, and constraints from schema.sql.
 */
export async function runMigrations(prisma: any): Promise<{ applied: boolean; error?: string }> {
  const alreadyInitialized = await isDatabaseInitialized(prisma);
  if (alreadyInitialized) {
    console.log('[Migration] Database already initialized, skipping.');
    return { applied: false };
  }

  const schemaPath = findSchemaSql();
  if (!schemaPath) {
    const msg = 'schema.sql not found in any expected location';
    console.error('[Migration] ' + msg);
    return { applied: false, error: msg };
  }

  console.log(`[Migration] Loading schema from ${schemaPath}`);
  const sqlContent = fs.readFileSync(schemaPath, 'utf-8');
  const statements = splitSqlStatements(sqlContent);
  console.log(`[Migration] Found ${statements.length} SQL statements to execute`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await prisma.$executeRawUnsafe(stmt);
    } catch (err: any) {
      if (err.message && err.message.includes('already exists')) {
        console.log(`[Migration] Skipping statement ${i + 1} (already exists): ${stmt.slice(0, 60)}...`);
        continue;
      }
      const msg = `Migration failed at statement ${i + 1}: ${err.message || err}`;
      console.error('[Migration] ' + msg);
      console.error('[Migration] SQL: ' + stmt.slice(0, 200));
      return { applied: false, error: msg };
    }
  }

  console.log('[Migration] Schema applied successfully!');
  return { applied: true };
}
