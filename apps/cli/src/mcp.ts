// @ts-nocheck
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { MemoOp } from "@memohub/protocol";
import { createKernel } from "./index.js";
import { IntegrationHub } from "@memohub/integration-hub";
import { createIngestEventHandler, INGEST_TOOL_METADATA } from "./mcp/tools/ingest.js";

/**
 * 运行全量 MCP 服务器 (MVP 版本)
 */
export async function runMcpServer(kernel: any): Promise<void> {
  const server = McpServer ? new McpServer({ name: "memohub", version: "1.0.0" }) : null;
  if (!server) throw new Error("MCP SDK not loaded correctly.");

  // 创建 IntegrationHub 实例
  const integrationHub = new IntegrationHub(kernel);

  // 0. INGEST: 事件摄取 (Integration Hub)
  server.tool(
    INGEST_TOOL_METADATA.name,
    {
      event: z.object({
        source: z.enum(["hermes", "ide", "cli", "mcp", "external"]),
        channel: z.string(),
        kind: z.enum(["memory"]),
        projectId: z.string(),
        confidence: z.enum(["reported", "observed", "inferred", "provisional", "verified"]),
        payload: z.object({
          text: z.string(),
          kind: z.enum(["memory"]).optional(),
          file_path: z.string().optional(),
          category: z.string().optional()
        })
      })
    },
    createIngestEventHandler(integrationHub)
  );

  // 1. ADD: 记忆注入
  server.tool(
    "memohub_add",
    {
      text: z.string().describe("The text content to remember"),
      trackId: z.enum(["track-insight", "track-source", "track-stream"]).default("track-insight"),
      meta: z.record(z.any()).optional()
    },
    async (params: any) => {
      const result = await kernel.dispatch({
        op: MemoOp.ADD,
        trackId: params.trackId,
        payload: { text: params.text, ...params.meta }
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  // 2. RETRIEVE: 语义检索
  server.tool(
    "memohub_search",
    {
      query: z.string().describe("Natural language query"),
      trackId: z.enum(["track-insight", "track-source"]).default("track-insight"),
      limit: z.number().optional().default(5)
    },
    async (params: any) => {
      const result = await kernel.dispatch({
        op: MemoOp.RETRIEVE,
        trackId: params.trackId,
        payload: { query: params.query, limit: params.limit }
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  // 3. DELETE: 记录移除
  server.tool(
    "memohub_delete",
    {
      ids: z.array(z.string()).describe("List of record IDs to remove"),
      trackId: z.string().default("track-insight")
    },
    async (params: any) => {
      const result = await kernel.dispatch({
        op: MemoOp.DELETE,
        trackId: params.trackId,
        payload: { ids: params.ids }
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  // 4. INSPECT: 系统状态资源
  server.resource(
    "memohub_stats",
    "memohub://stats",
    async () => {
      const tracks = await kernel.listTracks();
      const tools = kernel.listTools();
      return {
        contents: [{
          uri: "memohub://stats",
          text: JSON.stringify({ 
             status: 'active', 
             tracks: tracks.map((t:any) => t.id),
             tools: tools.map((t:any) => t.id)
          }, null, 2)
        }]
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
