import 'dotenv/config';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { logger } from '../shared/logger.js';

let initialized = false;

export function setupProductionEnv() {
  if (initialized) return;
  initialized = true;

  if (!app.isPackaged) {
    return;
  }

  const userDataPath = app.getPath('userData');
  let dbPath = path.join(userDataPath, 'dev.sqlite3');

  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    logger.info(`Database will be created at ${dbPath} on first connect`);
  }

  const dbUrl = `file:${dbPath.replace(/\\/g, '/')}`;
  process.env.DATABASE_URL = dbUrl;
  logger.info(`Database URL: ${process.env.DATABASE_URL}`);
}
