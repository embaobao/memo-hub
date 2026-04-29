import Fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import chalk from "chalk";

/**
 * 启动 MemoHub 守护进程 API 服务。
 *
 * HTTP API 与 CLI/MCP 一样只面向统一运行时，入口层不暴露内部调度细节。
 */
export async function startApiServer(runtime: any) {
  const server = Fastify({ logger: false });

  // 预留 WebSocket 通道：后续用于推送统一运行时事件。
  await server.register(fastifyWebsocket);

  server.get("/ws/trace", { websocket: true }, (connection: any) => {
    connection.socket.send(JSON.stringify({
      type: "RUNTIME_READY",
      payload: { runtime: "unified-memory-runtime" },
      timestamp: Date.now(),
    }));
  });

  // 核心状态检查：返回统一运行时能力视图。
  server.get("/api/inspect", async () => {
    try {
      const stats = await runtime.inspect();
      return {
        status: 'online',
        version: '1.0.0',
        ...stats,
      };
    } catch (e) {
      return { status: 'error', error: String(e) };
    }
  });

  // 统一摄取接口：只接受规范事件，由 runtime 负责归一化和投影。
  server.post("/api/ingest", async (request: any) => {
    return await runtime.ingest(request.body);
  });

  // 统一查询接口：使用命名视图，不支持按轨道查询。
  server.post("/api/query", async (request: any) => {
    return await runtime.queryView(request.body);
  });

  try {
    const port = Number(process.env.MEMOHUB_PORT ?? 3000);
    await server.listen({ port, host: "0.0.0.0" });
    console.log(chalk.cyan(`\n🧠 MemoHub Daemon is running on port ${port}`));
  } catch (err) {
    console.error(chalk.red(`Failed to start daemon: ${err}`));
    process.exit(1);
  }
}
