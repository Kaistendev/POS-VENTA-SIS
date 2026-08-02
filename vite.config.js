import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'use-sync-external-store/shim/with-selector.js':
        '/src/frontend/mock/useSyncExternalStoreWithSelector.mjs',
      'use-sync-external-store/shim/with-selector':
        '/src/frontend/mock/useSyncExternalStoreWithSelector.mjs',
      'use-sync-external-store/with-selector.js':
        '/src/frontend/mock/useSyncExternalStoreWithSelector.mjs',
      'use-sync-external-store/with-selector':
        '/src/frontend/mock/useSyncExternalStoreWithSelector.mjs',
    },
  },
  optimizeDeps: {
    exclude: ['recharts'],
    include: ['decimal.js-light', 'react-is'],
  },
})
