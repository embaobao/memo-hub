// @ts-nocheck
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createIngestEventHandler, INGEST_TOOL_METADATA } from "./mcp/tools/ingest.js";
import { createQueryHandler, QUERY_TOOL_METADATA } from "./mcp/tools/query.js";
import {
  createResolveClarificationHandler,
  RESOLVE_CLARIFICATION_TOOL_METADATA,
} from "./mcp/tools/resolve-clarification.js";
import {
  createConfigGetHandler,
  createConfigManageHandler,
  createConfigSetHandler,
} from "./mcp/tools/config.js";
import {
  runAgentOperation,
} from "./memory-interface.js";
import { MCP_RESOURCES, MCP_TOOLS } from "./interface-metadata.js";
import { createMcpAccessCatalog } from "./mcp/catalog.js";
import { McpLogger } from "./mcp/logger.js";
import type { UnifiedMemoryRuntime } from "./unified-memory-runtime.js";

const mcpTool = (name: string) => {
  const tool = MCP_TOOLS.find((item) => item.name === name);
  if (!tool) throw new Error(`Missing MCP metadata for ${name}`);
  return tool;
};

/**
 * 运行 MCP 服务器。
 *
 * MCP 是新架构的对外接入层，只接收统一事件、命名视图查询和 Agent 操作。
 */
export async function runMcpServer(runtime: UnifiedMemoryRuntime): Promise<void> {
  const server = McpServer ? new McpServer({ name: "memohub", version: "1.0.0" }) : null;
  if (!server) throw new Error("MCP SDK not loaded correctly.");
  const runtimeStats = await runtime.inspect();
  const runtimeConfig = (runtimeStats as any).config;
  const logger = new McpLogger(runtimeConfig?.mcp?.logPath);
  logger.write({ level: "info", event: "mcp.start", message: "MemoHub MCP server starting" });

  // 统一事件摄取：直接进入 UnifiedMemoryRuntime。
  server.tool(
    INGEST_TOOL_METADATA.name,
    {
      event: z.object({
        source: z.string(),
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
    createIngestEventHandler(runtime)
  );

  // 统一查询：只允许命名视图，具体召回层级由 QueryPlanner 负责。
  server.tool(
    QUERY_TOOL_METADATA.name,
    {
      view: z.enum(["agent_profile", "recent_activity", "project_context", "coding_context"]),
      actorId: z.string().optional(),
      projectId: z.string(),
      workspaceId: z.string().optional(),
      sessionId: z.string().optional(),
      taskId: z.string().optional(),
      query: z.string().optional(),
      limit: z.number().default(10).optional()
    },
    createQueryHandler(runtime)
  );

  server.tool(
    mcpTool("memohub_summarize").name,
    {
      text: z.string(),
      agentId: z.string().default("mcp").optional()
    },
    async (params: any) => {
      const result = await runAgentOperation({
        type: "summarize",
        text: params.text,
        sourceAgentId: params.agentId ?? "mcp",
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    mcpTool("memohub_clarify").name,
    {
      text: z.string(),
      agentId: z.string().default("mcp").optional()
    },
    async (params: any) => {
      const result = await runAgentOperation({
        type: "clarify",
        text: params.text,
        sourceAgentId: params.agentId ?? "mcp",
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  // 澄清回答写回：外部对话中确认的事实要进入统一记忆对象，后续查询才能复用。
  server.tool(
    RESOLVE_CLARIFICATION_TOOL_METADATA.name,
    {
      clarificationId: z.string(),
      answer: z.string(),
      resolvedBy: z.string().default("mcp").optional(),
      projectId: z.string().default("default").optional(),
      actorId: z.string().optional(),
      source: z.string().default("mcp").optional(),
      memoryIds: z.array(z.string()).optional(),
      question: z.string().optional(),
      reason: z.string().optional(),
    },
    async (params: any) => {
      logger.write({
        level: "info",
        event: "mcp.resolve_clarification",
        message: "Resolve clarification requested",
        metadata: { clarificationId: params.clarificationId, projectId: params.projectId },
      });
      const result = await createResolveClarificationHandler(runtime)(params);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    mcpTool("memohub_config_get").name,
    {
      path: z.string().optional(),
    },
    async (params: any) => {
      const result = await createConfigGetHandler()(params);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    mcpTool("memohub_config_set").name,
    {
      path: z.string(),
      value: z.union([z.string(), z.number(), z.boolean(), z.array(z.unknown()), z.record(z.unknown())]),
    },
    async (params: any) => {
      logger.write({
        level: "info",
        event: "mcp.config_set",
        message: "Config set requested",
        metadata: { path: params.path },
      });
      const result = await createConfigSetHandler()(params);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    mcpTool("memohub_config_manage").name,
    {
      action: z.enum(["check", "init", "uninstall"]),
    },
    async (params: any) => {
      logger.write({
        level: "info",
        event: "mcp.config_manage",
        message: "Config manage requested",
        metadata: { action: params.action },
      });
      const result = await createConfigManageHandler()(params);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  // 运行时状态资源：只展示统一运行时能力。
  server.resource(
    MCP_RESOURCES[0].name,
    MCP_RESOURCES[0].uri,
    async () => {
      const stats = await runtime.inspect();
      const catalog = createMcpAccessCatalog(process.cwd(), (stats as any).config);
      return {
        contents: [{
          uri: "memohub://stats",
          text: JSON.stringify({
            status: "active",
            ...stats,
            tools: catalog.tools.map((tool) => tool.name),
            resources: catalog.resources.map((resource) => resource.uri),
            storage: catalog.storage,
            logPath: logger.path,
          }, null, 2)
        }]
      };
    }
  );

  // 工具目录资源：Agent/skill 可先读这里，再决定如何写入、查询或澄清。
  server.resource(
    MCP_RESOURCES[1].name,
    MCP_RESOURCES[1].uri,
    async () => ({
      contents: [{
        uri: "memohub://tools",
        text: JSON.stringify(createMcpAccessCatalog(process.cwd(), runtimeConfig), null, 2),
      }],
    })
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.write({ level: "info", event: "mcp.ready", message: "MemoHub MCP server connected over stdio" });
}
