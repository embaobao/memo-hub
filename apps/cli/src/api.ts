import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

export async function startApiServer(kernel: any) {
  const server = Fastify({ logger: false });
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // 适配 src 和 dist 两种运行模式
  const webDistPath = fs.existsSync(path.resolve(__dirname, '../../web/dist'))
    ? path.resolve(__dirname, '../../web/dist')
    : path.resolve(__dirname, '../dist'); // 如果在 dist 跑

  if (fs.existsSync(webDistPath)) {
    console.log('[API] Serving Web UI from: ' + webDistPath);
    await server.register(fastifyStatic, {
      root: webDistPath,
      prefix: '/',
    });
  }

  // 核心数据反射接口
  server.get('/api/inspect', async () => {
    return {
      config: kernel.getConfig(),
      tools: await kernel.listTools(),
      tracks: await kernel.listTracks()
    };
  });

  server.get('/api/health', async () => ({ status: 'ok' }));

  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log('\n🚀 MemoHub Web Console: http://localhost:3000');
  } catch (err) {
    process.exit(1);
  }
}
