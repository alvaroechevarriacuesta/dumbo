import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './src/manifest'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    crx({ manifest })
  ],
  build: {
    rollupOptions: {
      input: {
        // Main app entry point
        main: 'index.html',
        // Extension side panel entry point
        'side-panel': 'side-panel.html'
      }
    }
  }
})
