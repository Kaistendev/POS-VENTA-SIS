import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'
import { builtinModules } from 'module'

// All Node.js built-in module names (with and without node: prefix)
const nodeBuiltins = [
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
]

/**
 * Externalizes every bare import for the Electron main/preload processes:
 * - All Node.js built-in modules (path, fs, url, crypto, …  and node:* variants)
 * - The `electron` package itself
 * - Every third-party npm package (anything that is not a relative or absolute path)
 *
 * This prevents CJS packages from being bundled into the ESM output, which
 * would cause "require is not defined" errors at runtime.
 */
function makeExternal(id) {
  if (id === 'electron') return true
  if (nodeBuiltins.includes(id)) return true
  // Bare import = not starting with '.', '/', or a drive letter (Windows)
  if (!id.startsWith('.') && !/^[A-Za-z]:/.test(id) && !id.startsWith('/')) return true
  return false
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'src/main/index.ts',
        vite: {
          build: {
            rollupOptions: {
              external: makeExternal,
            },
          },
        },
      },
      preload: {
        input: 'src/preload/index.ts',
        vite: {
          build: {
            rollupOptions: {
              external: makeExternal,
            },
          },
        },
      },
      renderer: {},
    }),
  ],
  // NOTE: Do NOT alias node: built-ins here – it applies to the main process
  // build too and strips the prefix before Rollup's external check runs,
  // causing packages like @prisma/client to be incorrectly bundled.
})

