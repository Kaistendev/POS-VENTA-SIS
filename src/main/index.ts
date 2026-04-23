// ⚠️ Must be the very first import — loads .env before any module side-effects run
import 'dotenv/config';

import { app, BrowserWindow } from "electron";
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

let win: BrowserWindow | null;

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
}

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
    console.log("✅ Prisma connected to PostgreSQL successfully.");
  } catch (err) {
    console.error("❌ Failed to connect to PostgreSQL:", err);
  }

  // 2. Setup IPC Handlers
  setupIpcHandlers();

  // 3. Create the window
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
