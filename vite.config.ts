import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
      vue(),
      tailwindcss(),
  ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {
      proxy: (function(){
       const API_TARGET = process.env.VITE_API_URL ?? 'http://localhost:8000'
          return {
              '/api': { target: API_TARGET, changeOrigin: true, secure: false },
              '/sanctum': { target: API_TARGET, changeOrigin: true, secure: false },
              '/broadcasting': { target: API_TARGET, changeOrigin: true, secure: false },
              '/login': { target: API_TARGET, changeOrigin: true, secure: false },
              '/logout': { target: API_TARGET, changeOrigin: true, secure: false },
          }
      })(),
 },
})
