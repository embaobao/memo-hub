import { describe, test, expect, beforeEach } from "bun:test";
import { createQueryHandler, QueryInputSchema, QueryType } from "./query.js";
import { MemoOp } from "@memohub/protocol";

describe("MCP Query Tool", () => {
  let mockKernel: any;
  let queryHandler: ReturnType<typeof createQueryHandler>;

  beforeEach(() => {
    // 创建 mock kernel
    mockKernel = {
      dispatch: async (instruction: any) => {
        const { op, trackId, payload } = instruction;

        if (op === MemoOp.RETRIEVE) {
          // 模拟检索结果
          if (trackId === "track-insight") {
            return {
              success: true,
              data: [
                {
                  id: "memory-1",
                  text: "Memory result 1",
                  meta: { projectId: payload.meta?.projectId || "test-project" }
                },
                {
                  id: "memory-2",
                  text: "Memory result 2",
                  meta: { projectId: payload.meta?.projectId || "test-project" }
                }
              ]
            };
          } else if (trackId === "track-source") {
            return {
              success: true,
              data: [
                {
                  id: "source-1",
                  content: "Source code snippet",
                  meta: { projectId: payload.meta?.projectId || "test-project" }
                }
              ]
            };
          }
        }

        return {
          success: false,
          error: { message: "Unknown operation" }
        };
      }
    };

    queryHandler = createQueryHandler(mockKernel);
  });

  test("应该成功执行 memory 查询", async () => {
    const input = {
      type: QueryType.MEMORY,
      projectId: "test-project",
      query: "test query",
      limit: 5
    };

    const result = await queryHandler(input);

    expect(result.success).toBe(true);
    expect(result.type).toBe("memory");
    expect(result.results).toBeDefined();
    expect(Array.isArray(result.results)).toBe(true);
    expect(result.count).toBeGreaterThan(0);
  });

  test("应该支持不带 query 的 memory 查询", async () => {
    const input = {
      type: QueryType.MEMORY,
      projectId: "auto-generated-project",
      limit: 10
    };

    const result = await queryHandler(input);

    expect(result.success).toBe(true);
    expect(result.query).toContain("auto-generated-project");
  });

  test("应该成功执行 coding_context 查询", async () => {
    const input = {
      type: QueryType.CODING_CONTEXT,
      projectId: "test-project",
      query: "coding context",
      limit: 10
    };

    const result = await queryHandler(input);

    expect(result.success).toBe(true);
    expect(result.type).toBe("coding_context");
    expect(result.results).toBeDefined();
    expect(result.results.memories).toBeDefined();
    expect(result.results.sources).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.summary.totalCount).toBeGreaterThan(0);
  });

  test("应该支持 sessionId 过滤", async () => {
    const input = {
      type: QueryType.MEMORY,
      projectId: "test-project",
      sessionId: "session-123",
      query: "test",
      limit: 5
    };

    const result = await queryHandler(input);

    expect(result.success).toBe(true);
    expect(result.filters.sessionId).toBe("session-123");
  });

  test("应该支持 taskId 过滤", async () => {
    const input = {
      type: QueryType.MEMORY,
      projectId: "test-project",
      taskId: "task-456",
      query: "test",
      limit: 5
    };

    const result = await queryHandler(input);

    expect(result.success).toBe(true);
    expect(result.filters.taskId).toBe("task-456");
  });

  test("应该正确处理默认 limit", async () => {
    const input = {
      type: QueryType.MEMORY,
      projectId: "test-project"
      // 不提供 limit
    };

    const result = await queryHandler(input);

    expect(result.success).toBe(true);
  });

  test("应该拒绝无效的查询类型", async () => {
    const input = {
      type: "invalid-type" as QueryType,
      projectId: "test-project"
    };

    const result = await queryHandler(input);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid input schema");
  });

  test("应该处理 memory 查询失败", async () => {
    // 创建一个会失败的 mock kernel
    const failingKernel = {
      dispatch: async () => {
        return {
          success: false,
          error: { message: "Database connection failed" }
        };
      }
    };

    const failingHandler = createQueryHandler(failingKernel);

    const input = {
      type: QueryType.MEMORY,
      projectId: "test-project",
      query: "test"
    };

    const result = await failingHandler(input);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test("应该处理 coding_context 部分失败", async () => {
    // 创建一个 memory 成功但 source 失败的 mock kernel
    const partialFailureKernel = {
      dispatch: async (instruction: any) => {
        if (instruction.trackId === "track-insight") {
          return {
            success: true,
            data: [{ id: "memory-1", text: "Memory" }]
          };
        } else {
          return {
            success: false,
            error: { message: "Source query failed" }
          };
        }
      }
    };

    const partialHandler = createQueryHandler(partialFailureKernel);

    const input = {
      type: QueryType.CODING_CONTEXT,
      projectId: "test-project"
    };

    const result = await partialHandler(input);

    // 应该返回部分成功
    expect(result.success).toBe(true);
    expect(result.results.memories.length).toBeGreaterThan(0);
    expect(result.results.sources.length).toBe(0);
  });

  test("应该验证输入 schema", () => {
    const validInput = {
      type: "memory" as const,
      projectId: "test-project",
      query: "test query",
      limit: 10
    };

    const result = QueryInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  test("coding_context 查询应该聚合多个轨道的结果", async () => {
    const input = {
      type: QueryType.CODING_CONTEXT,
      projectId: "my-project",
      query: "full stack development",
      limit: 20
    };

    const result = await queryHandler(input);

    expect(result.success).toBe(true);
    expect(result.summary.memoryCount).toBeGreaterThan(0);
    expect(result.summary.sourceCount).toBeGreaterThan(0);
    expect(result.summary.totalCount).toBe(
      result.summary.memoryCount + result.summary.sourceCount
    );
  });
});
