import { describe, test, expect, beforeEach } from "bun:test";
import { createIngestEventHandler, IngestEventInputSchema } from "./ingest.js";
import { IntegrationHub } from "@memohub/integration-hub";
import { MemoOp } from "@memohub/protocol";
import { EventSource, EventKind, EventConfidence } from "@memohub/protocol";

describe("MCP Ingest Tool", () => {
  let mockKernel: any;
  let integrationHub: IntegrationHub;
  let ingestHandler: ReturnType<typeof createIngestEventHandler>;

  beforeEach(() => {
    // 创建 mock kernel
    mockKernel = {
      dispatch: async (instruction: any) => {
        return {
          success: true,
          instructionId: "test-instruction-id",
          trackId: instruction.trackId || "track-insight"
        };
      },
      computeHash: async (content: string) => {
        // 简单的哈希模拟
        return `hash_${content.length}_${Buffer.from(content).toString('base64').slice(0, 16)}`;
      },
      write: async (content: string) => {
        return {
          hash: `hash_${content.length}`,
          exists: false
        };
      }
    };

    integrationHub = new IntegrationHub({
      kernel: mockKernel,
      cas: mockKernel, // 使用 mock kernel 作为 cas (简化测试)
      performance: null // 不使用性能监控
    });
    ingestHandler = createIngestEventHandler(integrationHub);
  });

  test("应该成功摄取有效事件", async () => {
    const input = {
      event: {
        source: EventSource.HERMES,
        channel: "test-channel",
        kind: EventKind.MEMORY,
        projectId: "test-project",
        confidence: EventConfidence.REPORTED,
        payload: {
          text: "Test memory content",
          kind: EventKind.MEMORY
        }
      }
    };

    const result = await ingestHandler(input);

    // 如果失败，打印错误信息
    if (!result.success) {
      console.log("Error:", result.error);
      console.log("Details:", result.details);
    }

    expect(result.success).toBe(true);
    expect(result.eventId).toBeDefined();
    expect(result.contentHash).toBeDefined();
    expect(result.contentLength).toBeGreaterThan(0);
  });

  test("应该拒绝缺少必需字段的输入", async () => {
    const input = {
      event: {
        source: EventSource.HERMES,
        channel: "test-channel",
        kind: EventKind.MEMORY,
        projectId: "test-project",
        confidence: EventConfidence.REPORTED,
        payload: {
          // 缺少 text 字段
        }
      }
    };

    const result = await ingestHandler(input);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid input schema");
  });

  test("应该拒绝无效的 source 值", async () => {
    const input = {
      event: {
        source: "invalid-source",
        channel: "test-channel",
        kind: EventKind.MEMORY,
        projectId: "test-project",
        confidence: EventConfidence.REPORTED,
        payload: {
          text: "Test"
        }
      }
    };

    const result = await ingestHandler(input);

    expect(result.success).toBe(false);
  });

  test("应该正确传递事件属性", async () => {
    let receivedInstruction: any = null;

    mockKernel.dispatch = async (instruction: any) => {
      receivedInstruction = instruction;
      return { success: true, instructionId: "test-id" };
    };

    const input = {
      event: {
        source: EventSource.IDE,
        channel: "vscode-extension",
        kind: EventKind.MEMORY,
        projectId: "my-project",
        confidence: EventConfidence.OBSERVED,
        payload: {
          text: "Important context from IDE",
          kind: EventKind.MEMORY,
          category: "development"
        }
      }
    };

    const result = await ingestHandler(input);

    expect(result.success).toBe(true);
    expect(result.eventId).toBeDefined();
    // 验证 kernel.dispatch 被调用
    expect(receivedInstruction).toBeDefined();
  });

  test("应该处理带有 file_path 的代码事件", async () => {
    const input = {
      event: {
        source: EventSource.EXTERNAL,
        channel: "code-analyzer",
        kind: EventKind.MEMORY,
        projectId: "code-base",
        confidence: EventConfidence.INFERRED,
        payload: {
          text: "function implementation",
          kind: EventKind.MEMORY,
          file_path: "src/utils/helper.ts",
          category: "code"
        }
      }
    };

    const result = await ingestHandler(input);

    expect(result.success).toBe(true);
  });

  test("应该捕获并返回 IntegrationHub 错误", async () => {
    mockKernel.dispatch = async () => {
      throw new Error("Integration Hub failure");
    };

    const input = {
      event: {
        source: EventSource.MCP,
        channel: "test",
        kind: EventKind.MEMORY,
        projectId: "test",
        confidence: EventConfidence.REPORTED,
        payload: {
          text: "Test"
        }
      }
    };

    const result = await ingestHandler(input);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test("应该验证输入 schema", () => {
    const validInput = {
      event: {
        source: "hermes",
        channel: "test",
        kind: "memory" as const,
        projectId: "test",
        confidence: "reported" as const,
        payload: {
          text: "Test content"
        }
      }
    };

    const result = IngestEventInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  test("应该接受所有有效的置信度级别", async () => {
    const confidences = [
      EventConfidence.REPORTED,
      EventConfidence.OBSERVED,
      EventConfidence.INFERRED,
      EventConfidence.PROVISIONAL,
      EventConfidence.VERIFIED
    ];

    for (const confidence of confidences) {
      const input = {
        event: {
          source: EventSource.CLI,
          channel: "test",
          kind: EventKind.MEMORY,
          projectId: "test",
          confidence,
          payload: {
            text: `Test with confidence ${confidence}`
          }
        }
      };

      const result = await ingestHandler(input);
      expect(result.success).toBe(true);
    }
  });

  test("应该返回内容长度统计", async () => {
    const longText = "A".repeat(1000);

    const input = {
      event: {
        source: EventSource.HERMES,
        channel: "test",
        kind: EventKind.MEMORY,
        projectId: "test",
        confidence: EventConfidence.REPORTED,
        payload: {
          text: longText
        }
      }
    };

    const result = await ingestHandler(input);

    expect(result.success).toBe(true);
    expect(result.contentLength).toBe(1000);
  });
});
