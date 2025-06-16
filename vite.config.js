import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": { // ✅ '/api'로 시작하는 요청을 자동으로 백엔드(`http://localhost:5000`)로 전달
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false
      }
    }
  }
})
