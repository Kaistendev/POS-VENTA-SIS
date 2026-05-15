require("dotenv").config();

// Determine the Prisma engine filename for the current platform
const isWin = process.platform === 'win32';
const engineName = isWin
  ? 'query_engine-windows.dll.node'
  : 'libquery_engine-debian-openssl-3.0.x.so.node';
const engineDestName = isWin ? 'prisma-engine.dll.node' : 'prisma-engine.so.node';

module.exports = {
  appId: "com.inventario.pos",
  productName: "InventarioPOS",
  directories: {
    output: "release 1.0.0",
  },
  files: [
    "dist/**/*",
    "dist-electron/**/*",
    "node_modules/**/*",
    {
      "from": "node_modules/.prisma",
      "to": "node_modules/.prisma",
      "filter": ["**/*"]
    },
    {
      "from": "node_modules/@prisma",
      "to": "node_modules/@prisma",
      "filter": ["**/*"]
    },
  ],
  extraResources: [
    // Bundle the generated schema DDL for first-run DB initialization
    {
      from: "prisma/schema.sql",
      to: "prisma/schema.sql"
    },
    // Bundle the Prisma query engine directly as a reliable fallback
    {
      from: `node_modules/.prisma/client/${engineName}`,
      to: engineDestName
    },
  ],
  win: {
    target: [{ target: "squirrel", arch: ["x64"] }],
  },
  linux: {
    target: [
      { target: "AppImage", arch: ["x64"] },
      { target: "deb", arch: ["x64"] },
    ],
    category: "Office",
    maintainer: process.env.AUTHOR_EMAIL,
  },
  squirrelWindows: {
    iconUrl:
      "https://raw.githubusercontent.com/inventario-pos/icon/master/favicon.ico",
  },
  asar: true,
  asarUnpack: [
    "node_modules/@prisma/client/**",
    "node_modules/@prisma/engines/**",
    "node_modules/better-sqlite3/**",
    "node_modules/.prisma/**",
  ],
};
