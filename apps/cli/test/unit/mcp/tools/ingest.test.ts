import { describe, test, expect, beforeEach } from "bun:test";
import { createIngestEventHandler, IngestEventInputSchema } from "../../../../src/mcp/tools/ingest.js";
import { EventSource, EventKind, EventConfidence } from "@memohub/protocol";

describe("MCP Ingest Tool", () => {
  let receivedEvent: any;
  let mockHub: any;
  let ingestHandler: ReturnType<typeof createIngestEventHandler>;

  beforeEach(() => {
    receivedEvent = null;
    mockHub = {
      ingest: async (event: any) => {
        receivedEvent = event;
        return {
          success: true,
          eventId: "evt_test",
          contentHash: "hash_test",
          canonicalEvent: {
            id: "evt_test",
            kind: "memory.ingested"
          },
          memoryObject: {
            id: "mem_evt_test",
            kind: "evidence"
          }
        };
      }
    };
    ingestHandler = createIngestEventHandler(mockHub);
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
    expect(result.canonicalEvent).toBeDefined();
    expect(result.memoryObject).toBeDefined();
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

  test("应该接受开放 source descriptor", async () => {
    const input = {
      event: {
        source: "gemini",
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

    expect(result.success).toBe(true);
    expect(receivedEvent.source).toBe("gemini");
  });

  test("应该正确传递事件属性", async () => {
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
    expect(receivedEvent).toBeDefined();
    expect(receivedEvent.source).toBe(EventSource.IDE);
    expect(receivedEvent.payload.category).toBe("development");
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
    mockHub.ingest = async () => {
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
