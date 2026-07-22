import { setupProductionEnv } from "./env.js";
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { buildContainer } from "./di/container.js";
import { setContainer } from "./di/registry.js";
import { logger } from "../shared/logger.js";

import { app, BrowserWindow, ipcMain, dialog, session } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { setupIpcHandlers } from "./ipc.js";
import { runMigrations } from "./utils/migrationRunner.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Will be initialized inside app.whenReady
let container: import("./di/registry.js").AppContainer | null = null;

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
  // 0. Initialize PrismaClient and DI container (after app is ready)
  setupProductionEnv();
  const prisma = new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! })
  });
  container = buildContainer(prisma);
  setContainer(container);

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
        detail: `${err.message || String(err)}\n\nDATABASE_URL: ${process.env.DATABASE_URL || '(not set)'}\n\nSi el problema persiste, contacta al administrador.`,
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

  // 5. Create the main window
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
