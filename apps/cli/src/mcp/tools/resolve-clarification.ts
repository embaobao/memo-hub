import { z } from "zod";
import type { UnifiedMemoryRuntime } from "../../unified-memory-runtime.js";

export const ResolveClarificationInputSchema = z.object({
  clarificationId: z.string().min(1).describe("澄清项 ID"),
  answer: z.string().min(1).describe("用户或 Agent 给出的澄清答案"),
  resolvedBy: z.string().default("mcp").describe("回答者或确认者"),
  projectId: z.string().default("default").describe("项目 ID"),
  actorId: z.string().optional().describe("关联 Agent/Actor ID"),
  source: z.string().default("mcp").describe("写入来源"),
  memoryIds: z.array(z.string()).optional().describe("被澄清的记忆 ID"),
  question: z.string().optional().describe("原始澄清问题"),
  reason: z.string().optional().describe("澄清原因"),
});

export type ResolveClarificationInput = z.infer<typeof ResolveClarificationInputSchema>;

/**
 * 创建澄清回答写回处理器。
 *
 * 这里不是只改 ClarificationItem 状态，而是把回答保存成可检索 MemoryObject，
 * 这样后续 Hermes、IDE、Codex 都能通过 project/coding context 读到修正后的上下文。
 */
export function createResolveClarificationHandler(runtime: UnifiedMemoryRuntime) {
  return async (params: ResolveClarificationInput) => {
    try {
      const validationResult = ResolveClarificationInputSchema.safeParse(params);
      if (!validationResult.success) {
        return {
          success: false,
          error: "Invalid input schema",
          details: validationResult.error.errors,
        };
      }

      const result = await runtime.resolveClarification(validationResult.data);
      return {
        success: result.success,
        clarification: result.clarification,
        memoryObject: result.memoryObject,
        contentHash: result.contentHash,
        vectorRecordCount: result.vectorRecordCount,
        error: result.error,
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

export const RESOLVE_CLARIFICATION_TOOL_METADATA = {
  name: "memohub_resolve_clarification",
  description: "写回外部澄清答案，并生成可检索的 curated MemoryObject",
  inputSchema: {
    type: "object" as const,
    properties: {
      clarificationId: { type: "string" as const, description: "澄清项 ID" },
      answer: { type: "string" as const, description: "澄清答案" },
      resolvedBy: { type: "string" as const, default: "mcp", description: "回答者或确认者" },
      projectId: { type: "string" as const, default: "default", description: "项目 ID" },
      actorId: { type: "string" as const, description: "关联 Agent/Actor ID" },
      source: { type: "string" as const, default: "mcp", description: "写入来源" },
      memoryIds: { type: "array" as const, items: { type: "string" as const }, description: "被澄清记忆 ID" },
      question: { type: "string" as const, description: "原始澄清问题" },
      reason: { type: "string" as const, description: "澄清原因" },
    },
    required: ["clarificationId", "answer"],
  },
};
