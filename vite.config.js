import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'

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
              external: ['knex', 'sqlite3'],
            },
          },
        },
      },
      preload: {
        input: 'src/preload/index.ts',
      },
      renderer: {},
    }),
  ],
})
