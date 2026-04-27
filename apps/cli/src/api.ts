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

  // --- LibreChat API 桥接层 ---
  
  // 1. 模拟 /api/models 接口，让 UI 看到 MemoHub 提供的模型
  server.get('/api/models', async () => {
    return {
      data: [
        { id: 'memohub-v1', name: 'MemoHub Core (Reactive)', provider: 'memohub' }
      ]
    };
  });

  // 2. 模拟 /api/ask/memohub 接口 (支持流式响应)
  server.post('/api/ask/memohub', async (request: any, reply) => {
    const { text, conversationId, messageId } = request.body;
    
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');

    // 启动内核分发
    const result = await kernel.dispatch({
      op: 'RETRIEVE' as any,
      trackId: 'track-insight',
      payload: { query: text, limit: 3 }
    });

    const fullResponse = result.success 
      ? `[Memory Kernel] ${result.data.map((r:any) => r.text).join('\n')}` 
      : 'No relevant memory found.';

    // 模拟流式输出 (V1 阶段：将结果分词后流出)
    const tokens = fullResponse.split(' ');
    for (const token of tokens) {
       const data = JSON.stringify({ text: token + ' ', messageId, conversationId });
       reply.raw.write(`data: ${data}\n\n`);
       await new Promise(r => setTimeout(r, 20)); // 模拟网络延迟
    }

    reply.raw.write('data: [DONE]\n\n');
    reply.raw.end();
  });

  // 3. 供应商与模型热配置接口
  server.get('/api/config/providers', async () => {
    return kernel.getConfig().ai.providers;
  });

  server.post('/api/config/providers', async (request: any) => {
    const { providers } = request.body;
    const config = kernel.getConfig();
    config.ai.providers = providers;
    
    // 写入磁盘持久化
    const configPath = path.resolve(os.homedir(), '.memohub', 'config.jsonc');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    console.log(chalk.green(`[API] AI Providers updated and saved to: ${configPath}`));
    return { success: true };
  });

  server.get('/api/mcp/skills', async () => {
    // 仿真 MCP 技能结构
    return {
      skills: [
        { 
          id: 'skill-web-search', 
          name: 'Web Search', 
          enabled: true,
          tools: [
            { id: 'google_search', description: 'Search the web using Google', enabled: true },
            { id: 'bing_search', description: 'Search the web using Bing', enabled: false }
          ]
        },
        {
          id: 'skill-file-system',
          name: 'Local File System',
          enabled: true,
          tools: [
            { id: 'read_file', description: 'Read local file content', enabled: true },
            { id: 'write_file', description: 'Write content to local file', enabled: true }
          ]
        }
      ]
    };
  });

  server.post('/api/mcp/tool/toggle', async (request: any) => {
    const { skillId, toolId, enabled } = request.body;
    console.log(chalk.yellow(`[MCP] Tool ${toolId} in ${skillId} toggled to: ${enabled}`));
    return { success: true };
  });

  server.get('/api/inspect', async (request, reply) => {
    try {
      const config = kernel.getConfig();
      const tools = (await kernel.listTools().catch(() => [])).map((t: any) => ({ 
        id: t.id, 
        type: t.type,
        description: t.description
      }));
      const tracks = (await kernel.listTracks().catch(() => [])).map((t: any) => ({ 
        id: t.id, 
        name: t.name || t.id,
        flows: t.flows || {}
      }));
      return { 
        config: { system: config.system || {} }, 
        tools: tools || [], 
        tracks: tracks || [] 
      };
    } catch (e) {
      return { config: {}, tools: [], tracks: [] };
    }
  });

  server.get('/api/workspaces', async () => {
    try {
      const root = path.resolve(os.homedir(), '.memohub');
      if (!fs.existsSync(root)) return { workspaces: ['default'] };
      const dirs = fs.readdirSync(root).filter(f => {
        try { return fs.statSync(path.join(root, f)).isDirectory(); } catch { return false; }
      });
      return { workspaces: ['default', ...dirs.filter(d => d !== 'blobs' && d !== 'data')] };
    } catch {
      return { workspaces: ['default'] };
    }
  });

  server.post('/api/workspace/switch', async (request: any) => {
    const { name } = request.body;
    console.log(chalk.magenta(`[API] Switching active workspace context to: ${name}`));
    return { success: true, current: name };
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
    try {
      const { trackId } = request.query as any;
      const storage = kernel.getVectorStorage();
      const cas = kernel.getCAS();
      let filter = '';
      if (trackId) filter = `track_id = '${trackId}'`;
      const records = await storage.list(filter, 100);
      const items = await Promise.all(records.map(async (r: any) => ({
        ...r,
        text: await cas.read(r.hash).catch(() => 'Content Missing')
      })));
      return { items };
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
