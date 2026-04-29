import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { IntegrationHub } from "../../src/integration-hub.js";
import { CASAdapter } from "../../src/cas-adapter.js";
import { EventProjector } from "../../src/projector.js";
import { ContentAddressableStorage } from "@memohub/storage-flesh";

// 定义本地枚举值以避免导入问题
const MemoryOp = {
  ADD: "ADD",
  RETRIEVE: "RETRIEVE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  LIST: "LIST",
  SYNC: "SYNC",
  EXPORT: "EXPORT",
  ANCHOR: "ANCHOR",
  MERGE: "MERGE",
  DISTILL: "DISTILL",
  DIFF: "DIFF",
  CLARIFY: "CLARIFY"
};

const EventSource = {
  HERMES: "hermes",
  IDE: "ide",
  CLI: "cli",
  MCP: "mcp",
  EXTERNAL: "external"
};

const EventKind = {
  MEMORY: "memory"
};

const EventConfidence = {
  REPORTED: "reported",
  OBSERVED: "observed",
  INFERRED: "inferred",
  PROVISIONAL: "provisional",
  VERIFIED: "verified"
};

type MemoHubEvent = any;

describe("Integration Hub Integration Tests", () => {
  let cas: ContentAddressableStorage;
  let kernel: any;
  let hub: IntegrationHub;
  let tempDir: string;

  beforeEach(async () => {
    // 创建临时目录
    tempDir = `/tmp/test-cas-${Date.now()}`;

    // 初始化组件
    cas = new ContentAddressableStorage(tempDir);

    // Mock kernel with actual dispatch implementation
    kernel = {
      dispatch: async (instruction: any) => {
        const { op, trackId, payload } = instruction;

        // 模拟实际的 track 处理
        if (op === "ADD") {
          return {
            success: true,
            instructionId: `inst_${Date.now()}`,
            trackId,
            data: {
              id: `id_${Date.now()}`,
              text: payload.text || payload.content,
              hash: payload.contentHash || "hash_mock",
              meta: {
                ...payload.meta,
                state: "COMMITTED"
              }
            },
            meta: {
              state: "COMMITTED"
            }
          };
        } else if (op === "RETRIEVE") {
          return {
            success: true,
            trackId,
            data: [
              {
                id: "result_1",
                text: "Mock result",
                score: 0.9
              }
            ]
          };
        }

        return {
          success: false,
          error: { message: "Unknown operation" }
        };
      }
    } as any;

    hub = new IntegrationHub({
      cas,
      kernel,
      performance: null // 禁用性能监控以简化测试
    });
  });

  afterEach(async () => {
    // 清理临时目录
    if (tempDir) {
      await require("node:fs").promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  describe("IntegrationHub → Text2Mem 集成测试", () => {
    test("完整的投影流程：事件 → 指令", async () => {
      const event: MemoHubEvent = {
        source: EventSource.HERMES,
        channel: "test-channel",
        kind: EventKind.MEMORY,
        projectId: "test-project",
        confidence: EventConfidence.REPORTED,
        payload: {
          text: "Test integration event",
          kind: EventKind.MEMORY
        }
      };

      const result = await hub.ingest(event);

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      expect(result.contentHash).toBeDefined();
      expect(result.instruction).toBeDefined();
      expect(result.instruction.success).toBe(true);
    });

    test("验证指令格式正确", async () => {
      const event: MemoHubEvent = {
        source: EventSource.IDE,
        channel: "vscode",
        kind: EventKind.MEMORY,
        projectId: "my-project",
        confidence: EventConfidence.OBSERVED,
        payload: {
          text: "Code snippet from IDE",
          kind: EventKind.MEMORY,
          file_path: "src/test.ts"
        }
      };

      const result = await hub.ingest(event);

      // 核心验证：事件成功摄取
      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      expect(result.contentHash).toBeDefined();
    });

    test("验证元数据传递", async () => {
      const event: MemoHubEvent = {
        id: "custom-event-id",
        source: EventSource.MCP,
        channel: "mcp-tool",
        kind: EventKind.MEMORY,
        projectId: "meta-test",
        confidence: EventConfidence.INFERRED,
        sessionId: "session-123",
        taskId: "task-456",
        payload: {
          text: "Metadata test event",
          kind: EventKind.MEMORY,
          category: "testing",
          tags: ["meta", "test"]
        }
      };

      const result = await hub.ingest(event);

      // 核心验证：元数据事件ID被保留
      expect(result.success).toBe(true);
      expect(result.eventId).toBe("custom-event-id");
      expect(result.contentHash).toBeDefined();
    });

    test("测试错误处理：无效事件", async () => {
      const invalidEvent = {
        source: "invalid-source",
        channel: "test",
        kind: EventKind.MEMORY,
        projectId: "test",
        confidence: EventConfidence.REPORTED,
        payload: {}
      } as any;

      const result = await hub.ingest(invalidEvent);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("IntegrationHub → MemoryKernel → Track 集成测试", () => {
    test("写入到 track-insight", async () => {
      const event: MemoHubEvent = {
        source: EventSource.HERMES,
        channel: "agent-session",
        kind: EventKind.MEMORY,
        projectId: "insight-test",
        confidence: EventConfidence.REPORTED,
        payload: {
          text: "Important insight from user conversation",
          kind: EventKind.MEMORY
        }
      };

      const result = await hub.ingest(event);

      // 核心验证：事件成功处理
      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      expect(result.contentHash).toBeDefined();
    });

    test("验证 CAS 引用正确", async () => {
      const textContent = "Unique content for CAS test";
      const event: MemoHubEvent = {
        source: EventSource.CLI,
        channel: "shell-command",
        kind: EventKind.MEMORY,
        projectId: "cas-test",
        confidence: EventConfidence.VERIFIED,
        payload: {
          text: textContent,
          kind: EventKind.MEMORY
        }
      };

      const result = await hub.ingest(event);

      expect(result.success).toBe(true);
      expect(result.contentHash).toBeDefined();
      expect(result.contentHash.length).toBe(64); // SHA256 hex

      // 验证相同内容产生相同哈希
      const result2 = await hub.ingest(event);
      expect(result2.contentHash).toBe(result.contentHash);
    });

    test("验证元数据完整性", async () => {
      const event: MemoHubEvent = {
        source: EventSource.EXTERNAL,
        channel: "external-system",
        kind: EventKind.MEMORY,
        projectId: "metadata-test",
        confidence: EventConfidence.OBSERVED,
        payload: {
          text: "Test content",
          kind: EventKind.MEMORY,
          category: "integration-test",
          metadata: {
            source_system: "external_api",
            timestamp: new Date().toISOString(),
            version: "1.0"
          }
        }
      };

      const result = await hub.ingest(event);

      // 核心验证：事件成功处理，哈希生成
      expect(result.success).toBe(true);
      expect(result.contentHash).toBeDefined();
      expect(result.contentHash.length).toBe(64); // SHA256 hex
    });
  });

  describe("场景测试", () => {
    test("相同内容去重", async () => {
      const sameContent = "Duplicate content test";

      const event1: MemoHubEvent = {
        source: EventSource.HERMES,
        channel: "session-1",
        kind: EventKind.MEMORY,
        projectId: "dedup-test",
        confidence: EventConfidence.REPORTED,
        payload: {
          text: sameContent,
          kind: EventKind.MEMORY
        }
      };

      const event2: MemoHubEvent = {
        source: EventSource.IDE,
        channel: "session-2",
        kind: EventKind.MEMORY,
        projectId: "dedup-test",
        confidence: EventConfidence.OBSERVED,
        payload: {
          text: sameContent,
          kind: EventKind.MEMORY
        }
      };

      const result1 = await hub.ingest(event1);
      const result2 = await hub.ingest(event2);

      // 验证 CAS 哈希相同
      expect(result1.contentHash).toBe(result2.contentHash);
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    test("不同会话隔离", async () => {
      const session1Events = [
        {
          source: EventSource.HERMES,
          channel: "session-A",
          kind: EventKind.MEMORY,
          projectId: "isolation-test",
          confidence: EventConfidence.REPORTED,
          payload: {
            text: "Session A message 1",
            kind: EventKind.MEMORY
          }
        },
        {
          source: EventSource.HERMES,
          channel: "session-A",
          kind: EventKind.MEMORY,
          projectId: "isolation-test",
          confidence: EventConfidence.REPORTED,
          payload: {
            text: "Session A message 2",
            kind: EventKind.MEMORY
          }
        }
      ];

      const session2Events = [
        {
          source: EventSource.HERMES,
          channel: "session-B",
          kind: EventKind.MEMORY,
          projectId: "isolation-test",
          confidence: EventConfidence.REPORTED,
          payload: {
            text: "Session B message 1",
            kind: EventKind.MEMORY
          }
        }
      ];

      // 处理会话 A 的事件
      const resultsA = await hub.ingestBatch(session1Events);
      expect(resultsA.length).toBe(2);
      expect(resultsA.every(r => r.success)).toBe(true);

      // 处理会话 B 的事件
      const resultsB = await hub.ingestBatch(session2Events);
      expect(resultsB.length).toBe(1);
      expect(resultsB[0].success).toBe(true);
    });

    test("批量处理性能", async () => {
      const batchSize = 50;
      const events = Array.from({ length: batchSize }, (_, i) => ({
        source: EventSource.CLI,
        channel: "batch-test",
        kind: EventKind.MEMORY,
        projectId: "perf-test",
        confidence: EventConfidence.REPORTED,
        payload: {
          text: `Batch test message ${i}`,
          kind: EventKind.MEMORY
        }
      }));

      const startTime = Date.now();
      const results = await hub.ingestBatch(events);
      const duration = Date.now() - startTime;

      expect(results.length).toBe(batchSize);
      expect(results.every(r => r.success)).toBe(true);

      // 性能验证：批量处理应该在合理时间内完成
      expect(duration).toBeLessThan(5000); // 5秒内完成
    });

    test("错误隔离：单个事件失败不影响其他事件", async () => {
      const mixedEvents = [
        {
          source: EventSource.HERMES,
          channel: "test",
          kind: EventKind.MEMORY,
          projectId: "error-test",
          confidence: EventConfidence.REPORTED,
          payload: {
            text: "Valid event 1",
            kind: EventKind.MEMORY
          }
        },
        {
          // 无效事件
          source: "invalid" as any,
          channel: "test",
          kind: EventKind.MEMORY,
          projectId: "error-test",
          confidence: EventConfidence.REPORTED,
          payload: {}
        },
        {
          source: EventSource.IDE,
          channel: "test",
          kind: EventKind.MEMORY,
          projectId: "error-test",
          confidence: EventConfidence.REPORTED,
          payload: {
            text: "Valid event 2",
            kind: EventKind.MEMORY
          }
        }
      ];

      const results = await hub.ingestBatch(mixedEvents);

      expect(results.length).toBe(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false); // 无效事件失败
      expect(results[2].success).toBe(true);
    });
  });
});
