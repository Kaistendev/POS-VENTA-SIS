import fs from 'fs'
import path from 'path'

const PATCHES = []

// 1. use-sync-external-store: emit a fully self-contained ESM module from the
//    real development build (which defines useSyncExternalStoreWithSelector,
//    importing only 'react'). rolldown-vite's CJS interop/pre-bundling collapses
//    this package into `react.useSyncExternalStoreWithSelector`, but React 19 no
//    longer exports that symbol, so the value becomes undefined. Making it a
//    real ESM module with the actual implementation fixes it everywhere.
PATCHES.push({
  targets: [
    'node_modules/.pnpm/use-sync-external-store@1.6.0_react@19.2.7/node_modules/use-sync-external-store/with-selector.js',
    'node_modules/.pnpm/use-sync-external-store@1.6.0_react@19.2.7/node_modules/use-sync-external-store/shim/with-selector.js',
  ],
patch: (content, filePath) => {
    // Find the package root dir: try the file's dir and its parent, whichever
    // actually contains the `cjs` implementation folder.
    const candidates = [path.dirname(filePath), path.dirname(path.dirname(filePath))]
    const pkgDir = candidates.find((d) => fs.existsSync(path.join(d, 'cjs')))
    if (!pkgDir) return content
    const devPath = path.join(pkgDir, 'cjs', 'use-sync-external-store-with-selector.development.js')
    if (!fs.existsSync(devPath)) return content
    let dev = fs.readFileSync(devPath, 'utf8')
    // Always run the dev IIFE regardless of NODE_ENV/appcd build mode.
    dev = dev.replace(/process\.env\.NODE_ENV/g, '"development"')
    // Replace the CJS `var React = require("react")` with the ESM import binding.
    dev = dev.replace(/var\s+React\s*=\s*require\("react"\),/g, 'var React = _reactModule,')
    const keys = [...new Set([...dev.matchAll(/exports\.([A-Za-z0-9_$]+)\s*=/g)].map((m) => m[1]))]
    const out = [
      `import * as _reactModule from 'react';`,
      `const exports = {};`,
      `"use strict";`,
      dev,
      ...keys.map((k) => `export const ${k} = exports.${k};`),
      `export default exports;`,
      '',
    ].join('\n')
    return out
  }
})

// 2. decimal.js-light: remove "browser" field from package.json to force using ESM decimal.mjs
PATCHES.push({
  targets: [
    'node_modules/decimal.js-light/package.json',
    'node_modules/.pnpm/decimal.js-light@2.5.1/node_modules/decimal.js-light/package.json',
  ],
  patch: (content) => {
    const pkg = JSON.parse(content)
    if (pkg.browser) {
      delete pkg.browser
      return JSON.stringify(pkg, null, 2) + '\n'
    }
    return content
  }
})

// 3. eventemitter3: create self-contained ESM that doesn't import from CJS
PATCHES.push({
  targets: [
    'node_modules/eventemitter3/index.mjs',
    'node_modules/.pnpm/eventemitter3@5.0.4/node_modules/eventemitter3/index.mjs',
  ],
  patch: (content, filePath) => {
    const cjsPath = filePath.replace('index.mjs', 'index.js')
    if (fs.existsSync(cjsPath)) {
      const cjs = fs.readFileSync(cjsPath, 'utf8')
      return cjs.replace(/\n\/\/\n\/\/ Allow[\s\S]*$/, '') + '\nexport { EventEmitter, EventEmitter as default };\n'
    }
    return content
  }
})

// 4. react-is: the entry index.js is a dynamic stub that does
//    `module.exports = require('./cjs/...')`, and rolldown can't produce the
//    named exports (nor a working default interop) from that. Instead of trying
//    to fix the CJS interop, emit a fully self-contained ESM module from the
//    dev build: it defines a local `exports` object, always runs the dev branch
//    (regardless of NODE_ENV), and re-exports every named export explicitly.
//    No external CJS import remains, so rolldown handles it as plain ESM.
PATCHES.push({
  targets: [
    'node_modules/react-is/index.js',
    'node_modules/.pnpm/react-is@19.2.7/node_modules/react-is/index.js',
    'node_modules/.pnpm/react-is@16.13.1/node_modules/react-is/index.js',
  ],
  patch: (content, filePath) => {
    const devPath = filePath.replace('index.js', 'cjs/react-is.development.js')
    if (!fs.existsSync(devPath)) return content
    let dev = fs.readFileSync(devPath, 'utf8')
    // Always run the dev IIFE regardless of NODE_ENV/appcd build mode.
    dev = dev.replace(/process\.env\.NODE_ENV/g, '"development"')
    const keys = [...new Set([...dev.matchAll(/exports\.([A-Za-z0-9_$]+)\s*=/g)].map((m) => m[1]))]
    const body = ['"use strict";', 'const exports = {};', dev,
      ...keys.map((k) => `export const ${k} = exports.${k};`),
      'export default exports;',
      ''].join('\n')
    return body
  }
})

// Apply all patches
for (const { targets, patch } of PATCHES) {
  for (const rel of targets) {
    const abs = path.resolve(rel)
    if (fs.existsSync(abs)) {
      const content = fs.readFileSync(abs, 'utf8')
      const patched = patch(content, abs)
      if (patched !== content) {
        fs.writeFileSync(abs, patched)
        console.log(`✅ Patched: ${rel}`)
      }
    }
  }
}

console.log('All patches applied!')
