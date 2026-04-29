import { z } from "zod";
import { MemoOp } from "@memohub/protocol";

/**
 * memohub_query MCP 工具
 *
 * 功能：统一的查询接口，支持多种查询类型
 * 位置：apps/cli/src/mcp/tools/query.ts
 */

/**
 * 查询类型枚举
 */
export enum QueryType {
  MEMORY = "memory",
  CODING_CONTEXT = "coding_context"
}

/**
 * 工具输入 Schema
 */
export const QueryInputSchema = z.object({
  type: z.enum([QueryType.MEMORY, QueryType.CODING_CONTEXT]).describe("查询类型"),
  projectId: z.string().describe("项目 ID"),
  sessionId: z.string().optional().describe("会话 ID（可选）"),
  taskId: z.string().optional().describe("任务 ID（可选）"),
  query: z.string().optional().describe("查询文本"),
  limit: z.number().default(10).describe("结果数量限制")
});

export type QueryInput = z.infer<typeof QueryInputSchema>;

/**
 * 创建 memohub_query 工具处理器
 */
export function createQueryHandler(kernel: any) {
  return async (params: QueryInput) => {
    try {
      // 1. 验证输入
      const validationResult = QueryInputSchema.safeParse(params);
      if (!validationResult.success) {
        return {
          success: false,
          error: "Invalid input schema",
          details: validationResult.error.errors
        };
      }

      const { type, projectId, sessionId, taskId, query, limit } = validationResult.data;

      // 2. 根据查询类型分发处理
      switch (type) {
        case QueryType.MEMORY:
          return await handleMemoryQuery(kernel, { projectId, sessionId, taskId, query, limit });

        case QueryType.CODING_CONTEXT:
          return await handleCodingContextQuery(kernel, { projectId, sessionId, taskId, query, limit });

        default:
          return {
            success: false,
            error: `Unknown query type: ${type}`
          };
      }

    } catch (error) {
      // 3. 错误处理
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined
      };
    }
  };
}

/**
 * 处理 memory 查询
 */
async function handleMemoryQuery(
  kernel: any,
  params: {
    projectId: string;
    sessionId?: string;
    taskId?: string;
    query?: string;
    limit: number;
  }
) {
  const { projectId, sessionId, taskId, query, limit } = params;

  // 使用 query 或默认查询
  const searchQuery = query || `project:${projectId}`;

  // 通过 MemoryKernel 检索记忆
  const result = await kernel.dispatch({
    op: MemoOp.RETRIEVE,
    trackId: "track-insight", // 默认从 insight 轨道检索
    payload: {
      query: searchQuery,
      limit,
      meta: {
        projectId,
        ...(sessionId && { sessionId }),
        ...(taskId && { taskId })
      }
    }
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error?.message || "Memory query failed",
      details: result.error
    };
  }

  return {
    success: true,
    type: "memory",
    results: result.data || [],
    count: result.data?.length || 0,
    query: searchQuery,
    filters: {
      projectId,
      ...(sessionId && { sessionId }),
      ...(taskId && { taskId })
    }
  };
}

/**
 * 处理 coding_context 查询
 */
async function handleCodingContextQuery(
  kernel: any,
  params: {
    projectId: string;
    sessionId?: string;
    taskId?: string;
    query?: string;
    limit: number;
  }
) {
  const { projectId, sessionId, taskId, query, limit } = params;

  const searchQuery = query || `project:${projectId} context`;

  // 1. 从 track-insight 检索记忆
  const memoryResult = await kernel.dispatch({
    op: MemoOp.RETRIEVE,
    trackId: "track-insight",
    payload: {
      query: searchQuery,
      limit: Math.ceil(limit / 2), // 分配一半配额给记忆
      meta: {
        projectId,
        ...(sessionId && { sessionId }),
        ...(taskId && { taskId })
      }
    }
  });

  // 2. 从 track-source 检索代码上下文
  const sourceResult = await kernel.dispatch({
    op: MemoOp.RETRIEVE,
    trackId: "track-source",
    payload: {
      query: searchQuery,
      limit: Math.ceil(limit / 2), // 分配一半配额给源码
      meta: {
        projectId,
        ...(sessionId && { sessionId }),
        ...(taskId && { taskId })
      }
    }
  });

  // 3. 聚合结果
  const memories = memoryResult.success ? (memoryResult.data || []) : [];
  const sources = sourceResult.success ? (sourceResult.data || []) : [];

  if (!memoryResult.success && !sourceResult.success) {
    return {
      success: false,
      error: "Both memory and source queries failed",
      details: {
        memoryError: memoryResult.error,
        sourceError: sourceResult.error
      }
    };
  }

  return {
    success: true,
    type: "coding_context",
    results: {
      memories,
      sources
    },
    summary: {
      memoryCount: memories.length,
      sourceCount: sources.length,
      totalCount: memories.length + sources.length
    },
    query: searchQuery,
    filters: {
      projectId,
      ...(sessionId && { sessionId }),
      ...(taskId && { taskId })
    }
  };
}

/**
 * 工具元数据
 */
export const QUERY_TOOL_METADATA = {
  name: "memohub_query",
  description: "统一查询接口 - 支持记忆和编码上下文查询",
  inputSchema: {
    type: "object" as const,
    properties: {
      type: {
        type: "string" as const,
        enum: ["memory", "coding_context"],
        description: "查询类型"
      },
      projectId: {
        type: "string" as const,
        description: "项目 ID"
      },
      sessionId: {
        type: "string" as const,
        description: "会话 ID（可选）"
      },
      taskId: {
        type: "string" as const,
        description: "任务 ID（可选）"
      },
      query: {
        type: "string" as const,
        description: "查询文本"
      },
      limit: {
        type: "number" as const,
        default: 10,
        description: "结果数量限制"
      }
    },
    required: ["type", "projectId"]
  }
};
