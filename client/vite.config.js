import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    global: 'globalThis',
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
      '/ws': {
        target: 'http://localhost:8080',
        ws: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) {
            return 'react-vendor'
          }
          if (id.includes('/antd/') || id.includes('/rc-')) return 'antd-vendor'
          if (id.includes('/@mui/') || id.includes('/@emotion/')) return 'mui-vendor'
          if (id.includes('/recharts/') || id.includes('/d3-')) return 'charts-vendor'
          if (id.includes('/leaflet')) return 'maps-vendor'
          return undefined
        },
      },
    },
  },
})

