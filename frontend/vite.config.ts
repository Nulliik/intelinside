import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Live data mode proxies /api and legacy /auth routes to Jack's backend on :8080.
// Supabase browser auth talks directly to the configured project in either data mode.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://127.0.0.1:8080',
      '/auth': {
        target: 'http://127.0.0.1:8080',
        bypass(req) {
          if (req.url && new URL(req.url, 'http://localhost').pathname === '/auth/callback') {
            return '/index.html'
          }
        },
      },
    },
  },
})
