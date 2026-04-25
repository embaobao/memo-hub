import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

/**
 * 启动 Web 控制台 API 服务
 */
export async function startApiServer(kernel: any) {
  const server = Fastify({ logger: false });
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // 核心：精准定位静态资源路径（兼容开发与编译环境）
  const webDistPath = path.resolve(__dirname, '../../web/dist');

  // 1. 注册 WebSocket 插件
  await server.register(fastifyWebsocket);

  server.get('/ws/trace', { websocket: true }, (connection: any) => {
    const interval = setInterval(() => {
        connection.socket.send(JSON.stringify({ type: 'HEARTBEAT', timestamp: Date.now() }));
    }, 5000);
    connection.socket.on('close', () => clearInterval(interval));
  });

  // 2. 注册 REST 路由
  server.get('/api/inspect', async () => {
    try {
      const config = kernel.getConfig();
      const tools = (await kernel.listTools()).map((t: any) => ({ id: t.id, type: t.type }));
      const tracks = (await kernel.listTracks()).map((t: any) => ({ id: t.id, name: t.name || t.id }));
      return { config: { system: config.system }, tools, tracks };
    } catch (e) {
      return { error: 'Failed to inspect kernel' };
    }
  });

  // 3. 托管静态资源
  if (fs.existsSync(webDistPath)) {
    console.log(chalk.gray(`[API] Serving React UI from: ${webDistPath}`));
    await server.register(fastifyStatic, {
      root: webDistPath,
      prefix: '/',
      index: ['index.html'],
      wildcard: false
    });

    // SPA Fallback: 找不到的路径返回 index.html
    server.setNotFoundHandler(async (request, reply) => {
      if (request.url.startsWith('/api')) {
        reply.code(404).send({ error: 'API route not found' });
        return;
      }
      return reply.sendFile('index.html');
    });
  } else {
    console.error(chalk.red(`[Error] Static directory not found: ${webDistPath}`));
  }

  try {
    const address = await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log(`\n🚀 MemoHub Web Console: ${address}`);
  } catch (err) {
    console.error(chalk.red(`[Error] Failed to start server: ${err}`));
    process.exit(1);
  }
}
