import { setupProductionEnv } from "./env.js";
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { buildContainer } from "./di/container.js";
import { setContainer } from "./di/registry.js";
import { logger } from "../shared/logger.js";

// ⚠️ Must run before PrismaClient is created — sets DATABASE_URL for production
setupProductionEnv();

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! })
});
const container = buildContainer(prisma);
setContainer(container);

import { app, BrowserWindow, ipcMain, dialog, session } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { setupIpcHandlers } from "./ipc.js";
import { runMigrations } from "./utils/migrationRunner.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// We define process.env.DIST depending on whether we are in dev/build
process.env.DIST = path.join(__dirname, "../dist");
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, "../public");

let win: BrowserWindow | null = null;

const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];

async function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(process.env.VITE_PUBLIC!, "favicon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "index.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    // Optional: Hide menu bar for a cleaner look
    autoHideMenuBar: true,
  });

  if (app.isPackaged) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'"
          ]
        }
      });
    });
  }

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(process.env.DIST!, "index.html"));
  }

  // Fix: Handle window focus issues on Windows
  win.on("blur", () => {
    setTimeout(() => {
      if (win && !win.isDestroyed() && !win.isFocused()) {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (!focusedWindow || focusedWindow === win) {
          win.focus();
        }
      }
    }, 100);
  });

  win.on("focus", () => {
    if (win && win.webContents) {
      win.webContents.focus();
    }
  });

  win.on("closed", () => {
    win = null;
  });
}

// IPC handler to force focus on the main window
ipcMain.handle("window:focus", () => {
  if (win && !win.isDestroyed()) {
    win.focus();
    win.webContents.focus();
    return true;
  }
  return false;
});

// IPC handler to check if window exists and is focusable
ipcMain.handle("window:is-ready", () => {
  return win && !win.isDestroyed();
});

// IPC handler for native dialogs (these properly handle focus)
ipcMain.handle("dialog:showMessageBox", (event, options) => {
  const focusedWindow = BrowserWindow.getFocusedWindow() || win;
  return dialog.showMessageBox(focusedWindow!, options);
});

ipcMain.handle("dialog:showOpenDialog", (event, options) => {
  const focusedWindow = BrowserWindow.getFocusedWindow() || win;
  return dialog.showOpenDialog(focusedWindow!, options);
});

ipcMain.handle("dialog:showSaveDialog", (event, options) => {
  const focusedWindow = BrowserWindow.getFocusedWindow() || win;
  return dialog.showSaveDialog(focusedWindow!, options);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.whenReady().then(async () => {
  // 1. Test Prisma connection and setup SQLite optimizations
  let prismaOk = false;
  try {
    await container.prisma.$connect();
    await container.prisma.$queryRaw`PRAGMA journal_mode=WAL`;
    await container.prisma.$queryRaw`PRAGMA synchronous=NORMAL`;
    await container.prisma.$queryRaw`PRAGMA cache_size=10000`;
    await container.prisma.$queryRaw`PRAGMA temp_store=MEMORY`;
    logger.info('Prisma connected to SQLite successfully');
    prismaOk = true;
  } catch (err: any) {
    const detail = [
      `Error: ${err.message || String(err)}`,
      err.code ? `Code: ${err.code}` : '',
      `DATABASE_URL: ${process.env.DATABASE_URL || '(not set)'}`,
      `resourcesPath: ${process.resourcesPath || '(not set)'}`,
      `appPath: ${app.getAppPath()}`,
    ].filter(Boolean).join('\n');
    logger.error({ err }, `Failed to connect to SQLite:\n${detail}`);
    try {
      await dialog.showMessageBox({
        type: 'error',
        title: 'Error de Base de Datos',
        message: 'No se pudo conectar a la base de datos SQLite.',
        detail: `Revisa que la instalación sea correcta o contacta al administrador.\n\nSi el problema persiste, revisa los logs de la aplicación.`,
      });
    } catch { /* ignore dialog errors */ }
  }

  // 2. Apply pending database migrations (first run only)
  if (prismaOk) {
    const migrationResult = await runMigrations(container.prisma);
    if (migrationResult.error) {
      logger.error({ err: migrationResult.error }, 'Migration error');
      try {
        await dialog.showMessageBox({
          type: 'error',
          title: 'Error de Migración',
          message: 'No se pudieron aplicar las migraciones de la base de datos.',
          detail: migrationResult.error,
        });
      } catch { /* ignore */ }
    }
  }

  // 3. Setup IPC Handlers
  setupIpcHandlers();

  // 4. Start scheduled tasks
  container.schedulerService.start();

  // 5. Load neural network classifier + RAG + Unified Query Service (optional)
  try {
    const { existsSync } = await import('fs');
    const { join, dirname } = await import('path');
    const modelPath = process.env.NEURAL_MODEL_PATH
      ? path.resolve(process.env.NEURAL_MODEL_PATH)
      : join(app.getAppPath(), 'neural_model');

    const ragDir = path.join(__dirname, '../infrastructure/rag/knowledge-base');

    if (existsSync(join(modelPath, 'model.json'))) {
      const { IntentClassifierService } = await import('../infrastructure/neural/models/IntentClassifierService.js');
      const { NeuralOrchestrator } = await import('../infrastructure/neural/orchestrator/neuralOrchestrator.js');
      const { RagService, KnowledgeBase } = await import('../infrastructure/rag/index.js');
      const { UnifiedQueryService } = await import('../infrastructure/neural/orchestrator/unifiedQueryService.js');

      const classifier = new IntentClassifierService();
      await classifier.loadModel(modelPath);
      const orchestrator = new NeuralOrchestrator(classifier);

      const kb = new KnowledgeBase();
      await kb.loadFromDirectory(ragDir);
      const rag = new RagService(kb);

      const unifiedQuery = new UnifiedQueryService(orchestrator, container.aiProvider, rag);

      container.aiService.setNeuralOrchestrator(orchestrator);
      container.aiService.setUnifiedQueryService(unifiedQuery);
      container.aiMonitorService.setUnifiedQueryService(unifiedQuery);
      await container.aiService.enableNeuralClassifier();
      logger.info({ modelPath }, 'Neural classifier + RAG + UnifiedQuery loaded');
    } else {
      logger.info('Neural model not found at ' + modelPath + ' — using LLM only');
    }
  } catch (err) {
    logger.warn({ err }, 'Neural classifier could not be loaded — using LLM only');
  }

  // 6. Create the main window
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
