// CLI 构建配置 - 使用 Bun 原生构建
// 注意：Vite 不适合用于 Node.js CLI 构建，因为无法正确处理原生模块
// 请使用: bun run build (使用 ts-compiler 或 bun build)

import { defineConfig } from 'vite';

export default defineConfig({
  // 此配置仅用于类型定义生成
  plugins: [],
  build: {
    // 禁用实际构建
    write: false,
  },
});