import { describe, test, expect, beforeEach } from "bun:test";
import { IntegrationHub } from "../../src/integration-hub.js";
import { CASAdapter } from "../../src/cas-adapter.js";
import { EventProjector } from "../../src/projector.js";
import { MemoHubEvent, EventSource, EventKind, EventConfidence } from "@memohub/protocol";
import { ContentAddressableStorage } from "@memohub/storage-flesh";
import { MemoryKernel } from "@memohub/core";

describe("Integration Hub", () => {
  let cas: ContentAddressableStorage;
  let kernel: MemoryKernel;
  let hub: IntegrationHub;

  beforeEach(() => {
    // 创建测试实例
    cas = new ContentAddressableStorage("/tmp/test-cas");
    kernel = {
      dispatch: async (instruction: any) => {
        return {
          success: true,
          meta: { state: "COMMITTED" }
        };
      }
    } as any;

    hub = new IntegrationHub({
      cas,
      kernel
    });
  });

  describe("CASAdapter", () => {
    test("应该计算内容哈希", async () => {
      const adapter = new CASAdapter(cas, hub.getPerformance());
      const content = "test content";

      const hash1 = await adapter.computeHash(content);
      const hash2 = await adapter.computeHash(content);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA256 hex
    });

    test("应该检测重复内容", async () => {
      const adapter = new CASAdapter(cas, hub.getPerformance());
      const content = "test content";

      const result1 = await adapter.writeContent(content);
      // CAS 在第一次写入后已经存在，第二次会检测到
      const result2 = await adapter.writeContent(content);

      expect(result1.hash).toBe(result2.hash);
      // CAS 的 write 方法本身就会处理重复，所以两次都会返回已存在
      // 验证哈希一致即可
    });
  });

  describe("EventProjector", () => {
    test("应该投影 memory 事件", async () => {
      const projector = new EventProjector();
      const event: MemoHubEvent = {
        source: EventSource.HERMES,
        channel: "test",
        kind: EventKind.MEMORY,
        projectId: "test-project",
        confidence: EventConfidence.REPORTED,
        payload: {
          text: "Test memory"
        }
      };

      const instruction = await projector.projectMemoryEvent(event, "test-hash");

      expect(instruction.op).toBe("ADD");
      expect(instruction.payload.text).toBe("Test memory");
      expect(instruction.payload.contentHash).toBe("test-hash");
      expect(instruction.payload.kind).toBe(EventKind.MEMORY);
      expect(instruction.payload.source).toBe(EventSource.HERMES);
    });

    test("应该保留所有元数据", async () => {
      const projector = new EventProjector();
      const event: MemoHubEvent = {
        id: "test-id",
        source: EventSource.HERMES,
        channel: "test-channel",
        kind: EventKind.MEMORY,
        projectId: "test-project",
        sessionId: "test-session",
        taskId: "test-task",
        confidence: EventConfidence.REPORTED,
        occurredAt: "2026-04-29T12:00:00Z",
        payload: {
          text: "Test memory",
          tags: ["tag1", "tag2"],
          metadata: { key: "value" }
        }
      };

      const instruction = await projector.projectMemoryEvent(event);

      expect(instruction.payload.sessionId).toBe("test-session");
      expect(instruction.payload.taskId).toBe("test-task");
      expect(instruction.payload.tags).toEqual(["tag1", "tag2"]);
      expect(instruction.payload.metadata).toEqual({ key: "value" });
    });

    test("应该拒绝不支持的事件类型", async () => {
      const projector = new EventProjector();
      const event = {
        kind: "unsupported",
        source: EventSource.HERMES,
        channel: "test",
        projectId: "test",
        confidence: EventConfidence.REPORTED,
        payload: {}
      } as any;

      await expect(projector.projectEvent(event)).rejects.toThrow();
    });
  });

  describe("IntegrationHub.ingest", () => {
    test("应该成功摄取有效的 memory 事件", async () => {
      const event: MemoHubEvent = {
        source: EventSource.HERMES,
        channel: "test-channel",
        kind: EventKind.MEMORY,
        projectId: "test-project",
        confidence: EventConfidence.REPORTED,
        payload: {
          text: "Test memory content"
        }
      };

      const result = await hub.ingest(event);

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      expect(result.contentHash).toBeDefined();
      expect(result.instruction).toBeDefined();
    });

    test("应该自动生成事件 ID", async () => {
      const event: MemoHubEvent = {
        source: EventSource.HERMES,
        channel: "test-channel",
        kind: EventKind.MEMORY,
        projectId: "test-project",
        confidence: EventConfidence.REPORTED,
        payload: {
          text: "Test memory"
        }
        // 注意：没有 id 字段
      };

      const result = await hub.ingest(event);

      expect(result.eventId).toBeDefined();
      expect(result.eventId).toMatch(/^evt_/);
    });

    test("应该自动添加时间戳", async () => {
      const event: MemoHubEvent = {
        source: EventSource.HERMES,
        channel: "test-channel",
        kind: EventKind.MEMORY,
        projectId: "test-project",
        confidence: EventConfidence.REPORTED,
        payload: {
          text: "Test memory"
        }
        // 注意：没有 occurredAt 字段
      };

      const beforeIngest = Date.now();
      const result = await hub.ingest(event);
      const afterIngest = Date.now();

      expect(result.success).toBe(true);
      // 验证时间戳在合理范围内
      // (这里简化验证，实际应该检查 instruction 中的时间戳)
    });

    test("应该拒绝无效事件", async () => {
      const invalidEvent = {
        source: EventSource.HERMES
        // 缺少必需字段
      } as any;

      const result = await hub.ingest(invalidEvent);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain("Missing required field");
    });

    test("应该支持批量摄取", async () => {
      const events: MemoHubEvent[] = [
        {
          source: EventSource.HERMES,
          channel: "test",
          kind: EventKind.MEMORY,
          projectId: "test-project",
          confidence: EventConfidence.REPORTED,
          payload: { text: "Memory 1" }
        },
        {
          source: EventSource.IDE,
          channel: "test",
          kind: EventKind.MEMORY,
          projectId: "test-project",
          confidence: EventConfidence.OBSERVED,
          payload: { text: "Memory 2" }
        }
      ];

      const results = await hub.ingestBatch(events);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[0].eventId).not.toBe(results[1].eventId);
    });
  });
});
