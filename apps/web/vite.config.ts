import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      // 使用 Fast Refresh
      fastRefresh: true,
    }),
  ],
  base: mode === 'development' ? '/' : './',

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // 开发服务器配置
  server: {
    port: 5173,
    host: true,
    strictPort: false,
    // API 代理配置
    proxy: {
      // 代理所有 API 请求到后端
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      // 代理 WebSocket 连接
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true,
        changeOrigin: true,
      },
    },
  },

  // 预览服务器配置
  preview: {
    port: 4173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true,
      },
    },
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: mode === 'development',
    // 优化生产构建
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'reactflow-vendor': ['reactflow'],
          'animation-vendor': ['framer-motion'],
          'utils-vendor': ['zustand', '@tanstack/react-query'],
        },
      },
    },
  },

  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'reactflow',
      'framer-motion',
      'zustand',
      '@tanstack/react-query',
    ],
  },
}));