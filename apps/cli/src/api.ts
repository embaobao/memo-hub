import Fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import chalk from "chalk";

/**
 * 启动 MemoHub 守护进程 API 服务
 */
export async function startApiServer(kernel: any) {
  const server = Fastify({ logger: false });

  // 1. 注册 WebSocket 插件用于实时事件监控 (TUI 监控基础)
  await server.register(fastifyWebsocket);

  server.get("/ws/trace", { websocket: true }, (connection: any) => {
    const eventHandler = (event: any) => {
      connection.socket.send(
        JSON.stringify({
          type: "KERNEL_EVENT",
          payload: event,
          timestamp: Date.now(),
        }),
      );
    };

    kernel.on("dispatch", eventHandler);
    connection.socket.on("close", () => {
      kernel.off("dispatch", eventHandler);
    });
  });

  // 2. 核心状态检查
  server.get("/api/inspect", async () => {
    try {
      const config = kernel.getConfig();
      const tools = kernel.listTools();
      const tracks = await kernel.listTracks();
      return {
        status: 'online',
        version: '1.0.0',
        config: { system: config.system || {} },
        tools: tools || [],
        tracks: tracks.map((t: any) => ({ id: t.id, name: t.name }))
      };
    } catch (e) {
      return { status: 'error', error: String(e) };
    }
  });

  // 3. 生产力接口
  server.post("/api/dispatch", async (request: any) => {
    return await kernel.dispatch(request.body);
  });

  server.get("/api/assets", async (request: any) => {
    try {
      const { trackId } = request.query as any;
      const storage = kernel.getVectorStorage();
      const cas = kernel.getCAS();
      let filter = "";
      if (trackId) filter = `track_id = '${trackId}'`;
      const records = await storage.list(filter, 100);
      const items = await Promise.all(
        records.map(async (r: any) => ({
          ...r,
          text: await cas.read(r.hash).catch(() => "Content Missing"),
        })),
      );
      return { items };
    } catch (e) {
      return { items: [], error: String(e) };
    }
  });

  try {
    const port = kernel.getConfig().system.port || 3000;
    await server.listen({ port, host: "0.0.0.0" });
    console.log(chalk.cyan(`\n🧠 MemoHub Daemon is running on port ${port}`));
  } catch (err) {
    console.error(chalk.red(`Failed to start daemon: ${err}`));
    process.exit(1);
  }
}
