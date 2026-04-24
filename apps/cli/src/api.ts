import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import { pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs';
import { MemoryKernel } from '@memohub/core';

/**
 * 启动 Web 控制台 API 服务
 */
export async function startApiServer(kernel: MemoryKernel) {
  const server = Fastify({ logger: true });

  // 1. 注册 WebSocket 插件用于实时 Trace
  await server.register(fastifyWebsocket);

  server.get('/ws/trace', { websocket: true }, (connection, req) => {
    connection.socket.on('message', (message: any) => {
        // Handle client messages if any
    });
    
    // 定期模拟脉冲数据 (测试用，后续对接 ObservationKernel)
    const interval = setInterval(() => {
        connection.socket.send(JSON.stringify({
            type: 'HEARTBEAT',
            timestamp: Date.now()
        }));
    }, 5000);

    connection.socket.on('close', () => clearInterval(interval));
  });

  // 2. 注册 REST 路由
  server.get('/api/inspect', async () => {
    const config = kernel.getConfig();
    const tools = await kernel.listTools();
    return { config, tools };
  });

  server.put('/api/config/shadow', async (request, reply) => {
    const newTracks = (request.body as any).tracks;
    // 热重载内存中的轨道配置
    // kernel.reloadFlows(newTracks);
    return { success: true };
  });

  // 3. 托管静态资源 (Web UI)
  const webDistPath = path.join(process.cwd(), 'apps/web/dist');
  if (fs.existsSync(webDistPath)) {
    server.register(fastifyStatic, {
      root: webDistPath,
      prefix: '/',
    });
  }

  const port = 3000;
  try {
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`\n🚀 API & Web Console running at http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}
