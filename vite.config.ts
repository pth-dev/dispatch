import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET?.trim()
  const proxyConfig = proxyTarget
    ? {
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
      }
    : undefined

  return {
    plugins: [react({ compiler: { logDiagnostics: true } }), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    ...(proxyConfig
      ? {
          server: { proxy: proxyConfig },
          preview: { proxy: proxyConfig },
        }
      : {}),
    build: {
      // Never emit source maps so original TypeScript/JSX source is not exposed in DevTools.
      sourcemap: false,
      rolldownOptions: {
        output: {
          entryFileNames: 'assets/[hash].js',
          chunkFileNames: 'assets/[hash].js',
          assetFileNames: 'assets/[hash][extname]',
          minify: {
            compress: {
              dropConsole: true,
              dropDebugger: true,
            },
            mangle: true,
          },
          codeSplitting: {
            groups: [
              {
                name: 'react-vendor',
                test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
              },
              {
                name: 'tanstack-vendor',
                test: /node_modules[\\/]@tanstack[\\/]/,
              },
              {
                name: 'radix-vendor',
                test: /node_modules[\\/](radix-ui|@radix-ui|lucide-react)[\\/]/,
              },
              {
                name: 'i18n-vendor',
                test: /node_modules[\\/](i18next|react-i18next)[\\/]/,
              },
            ],
          },
        },
      },
    },
  }
})
