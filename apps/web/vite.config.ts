import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { createRequire } from 'module';
import { VitePWA } from 'vite-plugin-pwa';
import { compression } from 'vite-plugin-compression2';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import type { Plugin } from 'vite';

const require = createRequire(import.meta.url);

const NODE_POLYFILL_SHIMS: Record<string, string> = {
  'vite-plugin-node-polyfills/shims/process': require.resolve('vite-plugin-node-polyfills/shims/process'),
  'vite-plugin-node-polyfills/shims/buffer': require.resolve('vite-plugin-node-polyfills/shims/buffer'),
  'vite-plugin-node-polyfills/shims/global': require.resolve('vite-plugin-node-polyfills/shims/global'),
};

const backendPort = (process.env.BACKEND_PORT && Number(process.env.BACKEND_PORT)) || 3080;
const backendURL = process.env.HOST ? `http://${process.env.HOST}:${backendPort}` : `http://localhost:${backendPort}`;

export default defineConfig(({ command }) => ({
  base: './', // 关键：使用相对路径兼容 monorepo 部署
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: 3001,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    {
      name: 'node-polyfills-shims-resolver',
      resolveId(id) { return NODE_POLYFILL_SHIMS[id] ?? null; },
    },
    nodePolyfills(),
    compression({ threshold: 10240 }),
  ],
  build: {
    outDir: './dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '~': path.join(__dirname, 'src/'),
      '$fonts': path.resolve(__dirname, 'public/fonts'),
      '@': path.resolve(__dirname, './src'),
      '@memohub/protocol': path.resolve(__dirname, '../../packages/protocol/src'),
      '@memohub/config': path.resolve(__dirname, '../../packages/config/src'),
    },
  },
}));
