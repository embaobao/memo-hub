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
  createLogsQueryHandler,
  LOGS_QUERY_TOOL_METADATA,
} from "./mcp/tools/logs.js";
import {
  createDataManageHandler,
  createConfigGetHandler,
  createConfigManageHandler,
  createConfigSetHandler,
} from "./mcp/tools/config.js";
import {
  createChannelCloseHandler,
  createChannelListHandler,
  createChannelOpenHandler,
  createChannelStatusHandler,
  createChannelUseHandler,
} from "./mcp/tools/channel.js";
import {
  runAgentOperation,
} from "./memory-interface.js";
import { MCP_RESOURCES, MCP_TOOLS } from "./interface-metadata.js";
import { createMcpAccessCatalog } from "./mcp/catalog.js";
import { McpLogger } from "./mcp/logger.js";
import type { UnifiedMemoryRuntime } from "./unified-memory-runtime.js";
import { McpSessionContextStore } from "./mcp/session-context.js";
import { CHANNEL_PURPOSES } from "@memohub/channel";

const mcpTool = (name: string) => {
  const tool = MCP_TOOLS.find((item) => item.name === name);
  if (!tool) throw new Error(`Missing MCP metadata for ${name}`);
  return tool;
};

function textResult(result: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
}

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
  const sessionContext = new McpSessionContextStore();
  logger.write({ level: "info", event: "mcp.start", message: "MemoHub MCP server starting" });

  // 统一事件摄取：直接进入 UnifiedMemoryRuntime。
  server.tool(
    INGEST_TOOL_METADATA.name,
    {
      event: z.object({
        source: z.string().optional(),
        channel: z.string().optional(),
        kind: z.enum(["memory"]),
        projectId: z.string().optional(),
        sessionId: z.string().optional(),
        taskId: z.string().optional(),
        confidence: z.enum(["reported", "observed", "inferred", "provisional", "verified"]),
        payload: z.object({
          text: z.string(),
          kind: z.enum(["memory"]).optional(),
          file_path: z.string().optional(),
          category: z.string().optional(),
          tags: z.array(z.string()).optional(),
          metadata: z.record(z.any()).optional(),
        })
      })
    },
    async (params: any) => {
      logger.write({
        level: "info",
        event: "mcp.ingest_event.request",
        message: "Ingest event requested",
        metadata: {
          source: params.event?.source,
          channel: params.event?.channel,
          projectId: params.event?.projectId,
          textLength: params.event?.payload?.text?.length ?? 0,
        },
      });
      const result = await createIngestEventHandler(runtime, sessionContext.get())(params);
      logger.write({
        level: result.success ? "info" : "error",
        event: "mcp.ingest_event.result",
        message: result.success ? "Ingest event completed" : "Ingest event failed",
        metadata: {
          success: result.success,
          eventId: result.eventId,
          error: result.error,
        },
      });
      return textResult(result);
    }
  );

  // 统一查询：只允许命名视图，具体召回层级由 QueryPlanner 负责。
  server.tool(
    QUERY_TOOL_METADATA.name,
    {
      view: z.enum(["agent_profile", "recent_activity", "project_context", "coding_context"]),
      actorId: z.string().optional(),
      projectId: z.string().optional(),
      workspaceId: z.string().optional(),
      sessionId: z.string().optional(),
      taskId: z.string().optional(),
      query: z.string().optional(),
      limit: z.number().default(10).optional()
    },
    async (params: any) => {
      logger.write({
        level: "info",
        event: "mcp.query.request",
        message: "Query requested",
        metadata: {
          view: params.view,
          actorId: params.actorId,
          projectId: params.projectId,
          query: params.query,
        },
      });
      const result = await createQueryHandler(runtime, sessionContext.get())(params);
      logger.write({
        level: result.success ? "info" : "error",
        event: "mcp.query.result",
        message: result.success ? "Query completed" : "Query failed",
        metadata: {
          success: result.success,
          view: result.view?.view,
          self: result.view?.selfContext?.length ?? 0,
          project: result.view?.projectContext?.length ?? 0,
          global: result.view?.globalContext?.length ?? 0,
          error: result.error,
        },
      });
      return textResult(result);
    }
  );

  server.tool(
    mcpTool("memohub_list").name,
    {
      perspective: z.enum(["actor", "project", "global"]),
      actorId: z.string().optional(),
      projectId: z.string().optional(),
      workspaceId: z.string().optional(),
      sessionId: z.string().optional(),
      taskId: z.string().optional(),
      domains: z.array(z.string()).optional(),
      limit: z.number().default(20).optional(),
    },
    async (params: any) => {
      const result = await runtime.listMemories({
        perspective: params.perspective,
        actorId: params.actorId ?? sessionContext.get()?.actorId,
        projectId: params.projectId ?? sessionContext.get()?.projectId,
        workspaceId: params.workspaceId ?? sessionContext.get()?.workspaceId,
        sessionId: params.sessionId ?? sessionContext.get()?.sessionId,
        taskId: params.taskId ?? sessionContext.get()?.taskId,
        domains: params.domains,
        limit: params.limit ?? 20,
      });
      return textResult({ success: true, perspective: params.perspective, memories: result });
    }
  );

  server.tool(
    mcpTool("memohub_summarize").name,
    {
      text: z.string(),
      actorId: z.string().default("mcp").optional()
    },
    async (params: any) => {
      const result = await runAgentOperation({
        type: "summarize",
        text: params.text,
        sourceAgentId: params.actorId ?? "mcp",
      });
      return textResult(result);
    }
  );

  server.tool(
    mcpTool("memohub_clarification_create").name,
    {
      text: z.string(),
      actorId: z.string().default("mcp").optional()
    },
    async (params: any) => {
      const result = await runAgentOperation({
        type: "clarify",
        text: params.text,
        sourceAgentId: params.actorId ?? "mcp",
      });
      return textResult(result);
    }
  );

  // 澄清回答写回：外部对话中确认的事实要进入统一记忆对象，后续查询才能复用。
  server.tool(
    mcpTool("memohub_logs_query").name,
    {
      tail: z.number().int().positive().optional(),
      event: z.string().optional(),
      level: z.enum(["debug", "info", "warn", "error"]).optional(),
      channel: z.string().optional(),
      projectId: z.string().optional(),
      sessionId: z.string().optional(),
      taskId: z.string().optional(),
      source: z.string().optional(),
    },
    async (params: any) => {
      logger.write({
        level: "info",
        event: "mcp.logs_query",
        message: "Logs query requested",
        metadata: { event: params.event, channel: params.channel, projectId: params.projectId, sessionId: params.sessionId, taskId: params.taskId, source: params.source },
      });
      const result = await createLogsQueryHandler(logger)(params);
      return textResult(result);
    }
  );

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
      return textResult(result);
    }
  );

  server.tool(
    mcpTool("memohub_config_get").name,
    {
      path: z.string().optional(),
    },
    async (params: any) => {
      const result = await createConfigGetHandler()(params);
      return textResult(result);
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
      return textResult(result);
    }
  );

  server.tool(
    mcpTool("memohub_config_manage").name,
    {
      action: z.enum(["check", "uninstall"]),
      confirm: z.string().optional(),
    },
    async (params: any) => {
      logger.write({
        level: "info",
        event: "mcp.config_manage",
        message: "Config manage requested",
        metadata: { action: params.action },
      });
      const result = await createConfigManageHandler(runtime)(params);
      return textResult(result);
    }
  );

  server.tool(
    mcpTool("memohub_data_manage").name,
    {
      action: z.enum(["status", "clean_all", "clean_channel", "rebuild_schema"]),
      channel: z.string().optional(),
      actorId: z.string().optional(),
      source: z.string().optional(),
      projectId: z.string().optional(),
      purpose: z.enum(CHANNEL_PURPOSES).optional(),
      status: z.enum(["active", "idle", "closed", "archived"]).optional(),
      confirm: z.string().optional(),
      dryRun: z.boolean().optional(),
    },
    async (params: any) => {
      logger.write({
        level: "info",
        event: "mcp.data_manage",
        message: "Data manage requested",
        metadata: { action: params.action },
      });
      const result = await createDataManageHandler(runtime)(params);
      return textResult(result);
    }
  );

  server.tool(
    mcpTool("memohub_channel_open").name,
    {
      actorId: z.string(),
      source: z.string(),
      projectId: z.string(),
      purpose: z.enum(CHANNEL_PURPOSES).default("primary").optional(),
      workspaceId: z.string().optional(),
      sessionId: z.string().optional(),
      taskId: z.string().optional(),
      channelId: z.string().optional(),
    },
    async (params: any) => {
      const result = await createChannelOpenHandler(runtime)(params);
      if (result.success && result.entry) {
        sessionContext.setFromEntry(result.entry);
      }
      return textResult(result);
    }
  );

  server.tool(
    mcpTool("memohub_channel_list").name,
    {
      actorId: z.string().optional(),
      source: z.string().optional(),
      projectId: z.string().optional(),
      workspaceId: z.string().optional(),
      purpose: z.enum(CHANNEL_PURPOSES).optional(),
      status: z.enum(["active", "idle", "closed", "archived"]).optional(),
    },
    async (params: any) => textResult(await createChannelListHandler(runtime)(params))
  );

  server.tool(
    mcpTool("memohub_channel_status").name,
    {
      channelId: z.string(),
    },
    async (params: any) => textResult(await createChannelStatusHandler(runtime)(params))
  );

  server.tool(
    mcpTool("memohub_channel_close").name,
    {
      channelId: z.string(),
    },
    async (params: any) => {
      const result = await createChannelCloseHandler(runtime)(params);
      if (result.success && result.entry) {
        sessionContext.clear(result.entry.channelId);
      }
      return textResult(result);
    }
  );

  server.tool(
    mcpTool("memohub_channel_use").name,
    {
      channelId: z.string(),
    },
    async (params: any) => {
      const result = await createChannelUseHandler(runtime)(params);
      if (result.success && result.entry) {
        sessionContext.setFromEntry(result.entry);
      }
      return textResult(result);
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
