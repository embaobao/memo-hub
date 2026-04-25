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

  // 2. 核心数据反射与编排接口
  server.get('/api/inspect', async () => {
    try {
      const config = kernel.getConfig();
      const tools = (await kernel.listTools()).map((t: any) => ({ 
        id: t.id, 
        type: t.type,
        description: t.description
      }));
      const tracks = (await kernel.listTracks()).map((t: any) => ({ 
        id: t.id, 
        name: t.name || t.id,
        flows: t.flows 
      }));
      return { config: { system: config.system }, tools, tracks };
    } catch (e) {
      return { error: 'Failed to inspect kernel' };
    }
  });

  server.get('/api/workspaces', async () => {
    const root = path.resolve(os.homedir(), '.memohub');
    if (!fs.existsSync(root)) return { workspaces: ['default'] };
    const dirs = fs.readdirSync(root).filter(f => fs.statSync(path.join(root, f)).isDirectory());
    return { workspaces: ['default', ...dirs.filter(d => d !== 'blobs' && d !== 'data')] };
  });

  server.post('/api/search', async (request: any) => {
    const { query, trackId, limit = 10 } = request.body;
    return await kernel.dispatch({
      op: 'RETRIEVE' as any,
      trackId: trackId || 'track-insight',
      payload: { query, limit }
    });
  });

  server.post('/api/chat', async (request: any) => {
    const { message } = request.body;
    // 模拟 Agent 思考逻辑：先检索再回答
    const result = await kernel.dispatch({
      op: 'RETRIEVE' as any,
      trackId: 'track-insight',
      payload: { query: message, limit: 3 }
    });
    const response = result.success && result.data.length > 0
      ? `Based on my memory: ${result.data.map((r:any) => r.text).join(' ')}`
      : "I don't recall specific info, but I am processing your request.";
    return { response, sources: result.data };
  });

  // 影子同步：热更新内存中的 Flow
  server.put('/api/config/shadow', async (request: any) => {
    const { trackId, op, flow } = request.body;
    const config = kernel.getConfig();
    const track = config.tracks.find((t: any) => t.id === trackId);
    if (track) {
      if (!track.flows) track.flows = {};
      track.flows[op] = flow;
      console.log(chalk.blue(`[ShadowSync] Hot-reloaded flow: ${trackId}:${op}`));
      return { success: true };
    }
    return { success: false, error: 'Track not found' };
  });

  server.post('/api/config/commit', async () => {
    const config = kernel.getConfig();
    const configPath = path.resolve(os.homedir(), '.memohub', 'config.jsonc');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(chalk.green(`[Commit] Config saved to ${configPath}`));
    return { success: true };
  });

  server.get('/api/assets', async (request: any) => {
    const storage = kernel.getVectorStorage();
    const cas = kernel.getCAS();
    const records = await storage.list('', 50);
    const items = await Promise.all(records.map(async (r: any) => ({
      ...r,
      text: await cas.read(r.hash).catch(() => 'Content Missing')
    })));
    return { items };
  });

  // 3. 托管静态资源
  if (fs.existsSync(webDistPath)) {
    console.log(chalk.gray(`[API] Serving React UI from: ${webDistPath}`));
    await server.register(fastifyStatic, {
      root: webDistPath,
      prefix: '/',
      index: ['index.html'],
    });

    server.setNotFoundHandler(async (request, reply) => {
      if (request.url.startsWith('/api')) return reply.code(404).send({ error: 'Not Found' });
      return reply.sendFile('index.html');
    });
  }

  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log(`\n🚀 MemoHub Web Console: http://localhost:3000`);
  } catch (err) {
    process.exit(1);
  }
}
