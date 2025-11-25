// frontend/vite.config.js
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  },
     // Configuración para el despliegue híbrido
  build: {
    // Asegura que los archivos de build se coloquen en 'dist'
    outDir: 'dist',
    // Limpia el directorio antes de cada build
    emptyOutDir: true,
  }
})
