import 'dotenv/config';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

let initialized = false;

/**
 * Try multiple strategies to locate the Prisma query engine binary.
 * Returns the path if found, or null if not found.
 */
function findPrismaEngine(engineName: string): string | null {
  const candidates: string[] = [];

  // 1. Primary: resources/app.asar.unpacked/node_modules/.prisma/client/
  candidates.push(
    path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', '.prisma', 'client', engineName),
  );

  // 2. Try without "app.asar.unpacked" wrapper (direct unpack)
  candidates.push(
    path.join(process.resourcesPath, 'node_modules', '.prisma', 'client', engineName),
  );

  // 3. Resources parent + app.asar.unpacked
  candidates.push(
    path.join(process.resourcesPath, '..', 'app.asar.unpacked', 'node_modules', '.prisma', 'client', engineName),
  );

  // 4. app.getAppPath() (the app directory)
  candidates.push(
    path.join(app.getAppPath(), 'node_modules', '.prisma', 'client', engineName),
  );

  // 5. app.getAppPath() with asar.unpacked
  candidates.push(
    path.join(app.getAppPath().replace('app.asar', 'app.asar.unpacked'), 'node_modules', '.prisma', 'client', engineName),
  );

  // 6. fallbackEnginePath (relative to current script's import.meta.url)
  try {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    candidates.push(
      path.join(currentDir.replace('app.asar', 'app.asar.unpacked'), '..', 'node_modules', '.prisma', 'client', engineName),
    );
    // Also try without the replace
    candidates.push(
      path.join(currentDir, '..', 'node_modules', '.prisma', 'client', engineName),
    );
    // Also try under node_modules/@prisma/client
    candidates.push(
      path.join(currentDir.replace('app.asar', 'app.asar.unpacked'), '..', 'node_modules', '@prisma', 'client', engineName),
    );
  } catch { /* ignore */ }

  // 7. Use module resolution to find @prisma/client, then derive engine path
  try {
    const _require = createRequire(import.meta.url);
    const prismaClientPath = _require.resolve('@prisma/client');
    const prismaClientDir = path.dirname(prismaClientPath);
    candidates.push(
      path.join(prismaClientDir, '..', '..', '.prisma', 'client', engineName),
    );
    candidates.push(
      path.join(prismaClientDir.replace('app.asar', 'app.asar.unpacked'), '..', '..', '.prisma', 'client', engineName),
    );
  } catch { /* ignore */ }

  // 8. extraResources path (if we bundle it directly)
  const extraResName = process.platform === 'win32' ? 'prisma-engine.dll.node' : 'prisma-engine.so.node';
  candidates.push(
    path.join(process.resourcesPath, extraResName),
  );

  // Deduplicate and test each candidate
  const tried = new Set<string>();
  for (const candidate of candidates) {
    if (tried.has(candidate)) continue;
    tried.add(candidate);
    try {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    } catch { /* ignore */ }
  }

  return null;
}

export function setupProductionEnv() {
  if (initialized) return;
  initialized = true;

  if (!app.isPackaged) {
    console.log('[Prisma] Running in development mode');
    return;
  }

  // In production, point DATABASE_URL to user data directory
  const userDataPath = app.getPath('userData');
  let dbPath = path.join(userDataPath, 'dev.sqlite3');

  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  // Create an empty database file if it doesn't exist.
  // Migrations will be applied at startup by the migration runner.
  if (!fs.existsSync(dbPath)) {
    console.log(`[Prisma] Creating fresh database at ${dbPath}`);
    fs.writeFileSync(dbPath, '');
  }

  process.env.DATABASE_URL = `file:${dbPath}`;
  console.log(`[Prisma] Database URL: ${process.env.DATABASE_URL}`);

  const engineName = process.platform === 'win32'
    ? 'query_engine-windows.dll.node'
    : 'libquery_engine-debian-openssl-3.0.x.so.node';

  const enginePath = findPrismaEngine(engineName);

  if (enginePath) {
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = enginePath;
    console.log(`[Prisma] Using engine: ${enginePath}`);
  } else {
    console.error(`[Prisma] Engine NOT FOUND! Tried multiple locations. Engine name: ${engineName}`);
    console.error(`[Prisma] resourcesPath: ${process.resourcesPath}`);
    console.error(`[Prisma] getAppPath(): ${app.getAppPath()}`);
  }
}
