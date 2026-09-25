import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // Listens on 0.0.0.0
    port: 5173,
    allowedHosts: true, // Allows Cloudflare trycloudflare domain headers
    watch: {
      usePolling: true, // Guarantees instant hot-reloading inside Docker on Windows bind-mounts
    },
  },
})
