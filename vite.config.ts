import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react({ compiler: { logDiagnostics: true } }), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // `public/` only holds the MSW service worker, which must never ship to
    // production. It stays served by the dev server because Vite reads
    // `publicDir` regardless of this flag.
    copyPublicDir: false,
  },
})
