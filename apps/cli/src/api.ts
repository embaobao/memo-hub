import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

export async function startApiServer(kernel: any) {
  const server = Fastify({ logger: false });
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // 适配开发环境 (src) 和 编译环境 (dist)
  // 开发环境下: apps/cli/src/api.ts -> apps/web/dist
  const webDistPath = path.resolve(__dirname, '../../web/dist');

  if (fs.existsSync(webDistPath)) {
    console.log('[API] Serving Web UI from: ' + webDistPath);
    await server.register(fastifyStatic, {
      root: webDistPath,
      prefix: '/',
      index: ['index.html'],
    });

    // SPA Fallback
    server.setNotFoundHandler(async (request, reply) => {
      if (request.url.startsWith('/api')) {
        reply.code(404).send({ error: 'API route not found' });
        return;
      }
      return reply.sendFile('index.html');
    });
  } else {
    console.warn('[Warning] apps/web/dist not found. Did you run "bun run build"?');
  }

  // 核心数据反射接口
  server.get('/api/inspect', async (request, reply) => {
    try {
      const config = kernel.getConfig();
      const tools = (await kernel.listTools()).map(t => ({
        id: t.id,
        type: t.type,
        description: t.description
      }));
      const tracks = (await kernel.listTracks()).map((t: any) => ({
        id: t.id,
        name: t.name || t.id
      }));
      
      // 仅返回可序列化的基础配置
      return {
        config: {
          version: config.version,
          system: { root: config.system.root, log_level: config.system.log_level },
          dispatcher: config.dispatcher
        },
        tools,
        tracks
      };
    } catch (err) {
      console.error('[API] Critical error in /api/inspect:', err);
      return reply.code(500).send({ error: 'Internal Kernel Error' });
    }
  });

  server.get('/api/health', async () => ({ status: 'ok' }));

  try {
    const address = await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log(`\n🚀 MemoHub Web Console: ${address}`);
  } catch (err) {
    console.error(chalk.red(`[Error] Failed to start API server: ${err}`));
    process.exit(1);
  }
}
