/**
 * Vite 配置文件
 * 构建工具配置，包含插件、别名、代理等
 */

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],

  // 解析配置
  resolve: {
    // 路径别名配置
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  // 开发服务器配置
  server: {
    port: 3000,
    open: true, // 启动后自动打开浏览器
    host: true, // 监听所有地址

    // 注意：已在前端代码中直接请求 http://localhost:8080/api
    // 如果后端未配置CORS，请取消注释以下代理配置
    /*
    // 代理配置，解决跨域问题
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // 后端服务器地址
        changeOrigin: true,
        rewrite: (path) => path  // 保持路径不变，将 /api/xxx 代理到 http://localhost:8080/api/xxx
      }
    }
    */
  },

  // 构建配置
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // 代码分割配置
        manualChunks: {
          'element-plus': ['element-plus'],
          'vue-vendor': ['vue', 'vue-router', 'pinia']
        }
      }
    }
  }
})