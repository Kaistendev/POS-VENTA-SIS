// ⚠️ Must be the very first import — loads .env before any module side-effects run
import 'dotenv/config';

import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { setupIpcHandlers } from "./ipc.js";
import { prisma } from "./prisma/client.js";

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
  // 1. Test Prisma connection
  try {
    await prisma.$connect();
    console.log("✅ Prisma connected to SQLite successfully.");
  } catch (err) {
    console.error("❌ Failed to connect to SQLite:", err);
  }

  // 2. Setup IPC Handlers
  setupIpcHandlers();

  // 3. Create the main window
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
