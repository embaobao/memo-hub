import { z } from "zod";
import { McpLogger } from "../logger.js";

export const LogsQueryInputSchema = z.object({
  tail: z.number().int().positive().default(50).optional().describe("读取最近多少条日志"),
  event: z.string().optional().describe("按事件名过滤"),
  level: z.enum(["debug", "info", "warn", "error"]).optional().describe("按日志级别过滤"),
  channel: z.string().optional().describe("按渠道过滤"),
  projectId: z.string().optional().describe("按项目过滤"),
  sessionId: z.string().optional().describe("按会话过滤"),
  taskId: z.string().optional().describe("按任务过滤"),
  source: z.string().optional().describe("按来源过滤"),
});

export function createLogsQueryHandler(logger: McpLogger) {
  return async (params: z.infer<typeof LogsQueryInputSchema>) => {
    const parsed = LogsQueryInputSchema.safeParse(params);
    if (!parsed.success) {
      return { success: false, error: "Invalid input schema", details: parsed.error.errors };
    }

    const data = parsed.data;
    const entries = logger.readEntries(data.tail ?? 50).filter((entry) => {
      const metadata = (entry.metadata ?? {}) as Record<string, unknown>;
      return (!data.level || entry.level === data.level)
        && (!data.event || entry.event === data.event)
        && (!data.channel || metadata.channel === data.channel)
        && (!data.projectId || metadata.projectId === data.projectId)
        && (!data.sessionId || metadata.sessionId === data.sessionId)
        && (!data.taskId || metadata.taskId === data.taskId)
        && (!data.source || metadata.source === data.source);
    });

    return {
      success: true,
      logPath: logger.path,
      count: entries.length,
      entries,
    };
  };
}

export const LOGS_QUERY_TOOL_METADATA = {
  name: "memohub_logs_query",
  description: "查询 MemoHub MCP 日志，支持按事件、级别、渠道、项目、会话、任务和来源过滤",
};
