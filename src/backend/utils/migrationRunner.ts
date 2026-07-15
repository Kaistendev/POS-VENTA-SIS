import { logger } from '../../shared/logger.js';
import { SCHEMA_SQL } from './generatedSchema.js';

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
 * Creates all tables, indexes, and constraints from the embedded schema.
 */
export async function runMigrations(prisma: any): Promise<{ applied: boolean; error?: string }> {
  const alreadyInitialized = await isDatabaseInitialized(prisma);
  if (alreadyInitialized) {
    logger.info('Database already initialized, skipping.');
    return { applied: false };
  }

  logger.info('Loading embedded schema');
  const statements = splitSqlStatements(SCHEMA_SQL);
  logger.info(`Found ${statements.length} SQL statements to execute`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await prisma.$executeRawUnsafe(stmt);
    } catch (err: any) {
      if (err.message && err.message.includes('already exists')) {
        logger.info(`Skipping statement ${i + 1} (already exists): ${stmt.slice(0, 60)}...`);
        continue;
      }
      const msg = `Migration failed at statement ${i + 1}: ${err.message || err}`;
      logger.error(msg);
      logger.error(`SQL: ${stmt.slice(0, 200)}`);
      return { applied: false, error: msg };
    }
  }

  logger.info('Schema applied successfully!');

  // Refresh Prisma's schema cache by cycling the connection
  try {
    await prisma.$disconnect();
    await prisma.$connect();
    logger.info('Prisma connection refreshed');
  } catch (e) {
    logger.error({ err: e }, 'Failed to refresh Prisma connection');
    return { applied: true, error: 'Migrations applied but failed to refresh connection' };
  }

  return { applied: true };
}
