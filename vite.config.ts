import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET?.trim()

  return {
    plugins: [react({ compiler: { logDiagnostics: true } }), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    ...(proxyTarget
      ? {
          server: {
            proxy: {
              '/api': {
                target: proxyTarget,
                changeOrigin: true,
                secure: false,
              },
              '/uploads': {
                target: proxyTarget,
                changeOrigin: true,
                secure: false,
              },
            },
          },
        }
      : {}),
    build: {
      // `public/` only holds the MSW service worker, which must never ship to
      // production. It stays served by the dev server because Vite reads
      // `publicDir` regardless of this flag.
      copyPublicDir: false,
    },
  }
})
