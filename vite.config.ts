import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './src/manifest'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isExtensionV2 = mode === 'extension-v2';
  
  return {
    plugins: [
      react(),
      crx({ manifest })
    ],
    server: {
      hmr: {
        protocol: 'wss',
        host: 'localhost',
        clientPort: 5173
      }
    },
    build: {
      rollupOptions: {
        input: isExtensionV2 ? {
          'side-panel': 'side-panel-v2.html'
        } : {
          // Main app entry point
          main: 'index.html',
          // Extension side panel entry point
          'side-panel': 'side-panel.html'
        } as Record<string, string>
      }
    }
  }
})
