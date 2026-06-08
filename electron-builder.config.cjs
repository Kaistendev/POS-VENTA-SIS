require("dotenv").config();

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
    {
      from: "prisma/schema.sql",
      to: "prisma/schema.sql"
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
    "node_modules/better-sqlite3/**",
    "node_modules/.prisma/**",
  ],
};
