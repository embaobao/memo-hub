import { z } from "zod";
import { EventSource } from "@memohub/protocol";
import { queryMemoryView } from "../../memory-interface.js";
import type { UnifiedMemoryRuntime } from "../../unified-memory-runtime.js";

export const QUERY_VIEWS = ["agent_profile", "recent_activity", "project_context", "coding_context"] as const;

/**
 * MCP 查询输入使用命名视图语义，所有召回都经过 QueryPlanner。
 */
export const QueryInputSchema = z.object({
  view: z.enum(QUERY_VIEWS).describe("命名上下文视图"),
  actorId: z.string().optional().describe("Agent/Actor ID（可选）"),
  projectId: z.string().describe("项目 ID"),
  workspaceId: z.string().optional().describe("工作区 ID（可选）"),
  sessionId: z.string().optional().describe("会话 ID（可选）"),
  taskId: z.string().optional().describe("任务 ID（可选）"),
  query: z.string().optional().describe("查询文本"),
  limit: z.number().default(10).describe("每层结果数量限制"),
});

export type QueryInput = z.infer<typeof QueryInputSchema>;

/**
 * 创建 memohub_query 处理器。
 *
 * 关键边界：这里只调用统一记忆运行时，不直接构造 Text2MemInstruction。
 */
export function createQueryHandler(runtime: UnifiedMemoryRuntime) {
  return async (params: QueryInput) => {
    try {
      const validationResult = QueryInputSchema.safeParse(params);
      if (!validationResult.success) {
        return {
          success: false,
          error: "Invalid input schema",
          details: validationResult.error.errors,
        };
      }

      const view = await queryMemoryView(runtime, {
        ...validationResult.data,
        source: EventSource.MCP,
      });

      return {
        success: true,
        view,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      };
    }
  };
}

export const QUERY_TOOL_METADATA = {
  name: "memohub_query",
  description: "统一分层记忆查询接口，只支持命名上下文视图",
  inputSchema: {
    type: "object" as const,
    properties: {
      view: {
        type: "string" as const,
        enum: QUERY_VIEWS,
        description: "命名上下文视图",
      },
      actorId: {
        type: "string" as const,
        description: "Agent/Actor ID（可选）",
      },
      projectId: {
        type: "string" as const,
        description: "项目 ID",
      },
      workspaceId: {
        type: "string" as const,
        description: "工作区 ID（可选）",
      },
      sessionId: {
        type: "string" as const,
        description: "会话 ID（可选）",
      },
      taskId: {
        type: "string" as const,
        description: "任务 ID（可选）",
      },
      query: {
        type: "string" as const,
        description: "查询文本",
      },
      limit: {
        type: "number" as const,
        default: 10,
        description: "每层结果数量限制",
      },
    },
    required: ["view", "projectId"],
  },
};
