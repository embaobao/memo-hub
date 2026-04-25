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

  // 1. 注册 WebSocket 插件用于实时 Trace
  await server.register(fastifyWebsocket);

  server.get('/ws/trace', { websocket: true }, (connection: any) => {
    console.log(chalk.blue('[WS] Client connected for Trace Stream'));
    
    // 监听内核分发事件并广播
    const eventHandler = (event: any) => {
      connection.socket.send(JSON.stringify({
        type: 'KERNEL_EVENT',
        payload: event,
        timestamp: Date.now()
      }));
    };

    kernel.on('dispatch', eventHandler);

    const heartbeat = setInterval(() => {
      connection.socket.send(JSON.stringify({ type: 'HEARTBEAT' }));
    }, 10000);

    connection.socket.on('close', () => {
      clearInterval(heartbeat);
      kernel.off('dispatch', eventHandler);
    });
  });

  // 2. 核心数据反射与检索接口
  server.get('/api/inspect', async () => {
    const config = kernel.getConfig();
    const tools = (await kernel.listTools()).map((t: any) => ({ 
      id: t.id, 
      type: t.type,
      description: t.description,
      inputSchema: t.inputSchema 
    }));
    const tracks = (await kernel.listTracks()).map((t: any) => ({ 
      id: t.id, 
      name: t.name || t.id,
      flows: t.flows 
    }));
    return { config, tools, tracks };
  });

  server.post('/api/search', async (request: any) => {
    const { query, trackId, limit = 10 } = request.body;
    return await kernel.dispatch({
      op: 'RETRIEVE' as any,
      trackId: trackId || 'track-insight',
      payload: { query, limit }
    });
  });

  server.get('/api/assets', async (request: any) => {
    const { trackId } = request.query;
    try {
      const storage = kernel.getVectorStorage();
      const cas = kernel.getCAS();
      
      let filter = '';
      if (trackId) filter = `track_id = '${trackId}'`;
      
      const records = await storage.list(filter, 100);
      
      // 并行脱壳内容
      const hydrated = await Promise.all(records.map(async (r: any) => ({
        ...r,
        text: await cas.read(r.hash).catch(() => 'Content not found in CAS')
      })));

      return { items: hydrated };
    } catch (e) {
      return { items: [], error: String(e) };
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
