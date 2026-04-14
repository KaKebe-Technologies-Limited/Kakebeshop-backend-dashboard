import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/admin': {
        target: 'https://backend.kakebeshop.com',
        changeOrigin: true,
        secure: true,
      },
      '/api': {
        target: 'https://backend.kakebeshop.com',
        changeOrigin: true,
        secure: true,
      },
      '/auth': {
        target: 'https://backend.kakebeshop.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
