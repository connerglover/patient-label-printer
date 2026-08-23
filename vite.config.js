import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Cloudflare Pages serves `dist/` directly; hashed asset names are
    // immutable-cacheable via public/_headers.
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          // xlsx + jspdf are large and only needed once the user acts;
          // splitting them keeps the first paint fast.
          spreadsheet: ['xlsx'],
          pdf: ['jspdf'],
        },
      },
    },
  },
})
