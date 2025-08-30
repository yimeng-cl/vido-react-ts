import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        // 启用JavaScript模式
        javascriptEnabled: true,
        // 数学计算模式
        math: 'always',
      },
    },
  },
})
