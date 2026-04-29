import { describe, test, expect } from "bun:test";
import { createIngestEventHandler } from "../../src/mcp/tools/ingest.js";
import { createQueryHandler } from "../../src/mcp/tools/query.js";
import { IngestEventInputSchema } from "../../src/mcp/tools/ingest.js";
import { QueryInputSchema } from "../../src/mcp/tools/query.js";

describe("E2E Tests: Core Functionality", () => {
  describe("基本功能端到端测试", () => {
    test("完整的事件摄取流程", async () => {
      // Mock IntegrationHub
      const mockHub = {
        ingest: async (event: any) => {
          // 模拟完整的摄取流程
          const eventId = `evt_${Date.now()}`;
          const contentHash = `hash_${Buffer.from(event.payload.text).toString('base64').slice(0, 16)}`;

          return {
            success: true,
            eventId,
            contentHash,
            instruction: {
              success: true,
              instructionId: `inst_${Date.now()}`
            }
          };
        }
      };

      const handler = createIngestEventHandler(mockHub);

      const input = {
        event: {
          source: "hermes",
          channel: "e2e-test-session",
          kind: "memory",
          projectId: "e2e-test-project",
          confidence: "reported",
          payload: {
            text: "E2E test: Complete event ingestion flow",
            kind: "memory"
          }
        }
      };

      const result = await handler(input);

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      expect(result.contentHash).toBeDefined();
      expect(result.instruction).toBeDefined();
    });

    test("完整的查询流程", async () => {
      const mockRuntime = {
        queryView: async (request: any) => {
          return {
            view: request.view,
            selfContext: [{ object: { id: "result_1" }, layer: "self" }],
            projectContext: [{ object: { id: "result_2" }, layer: "project" }],
            globalContext: [],
            conflictsOrGaps: [],
            sources: [],
            metadata: { policyId: "test" },
          };
        }
      };

      const handler = createQueryHandler(mockRuntime as never);

      const input = {
        view: "project_context",
        projectId: "e2e-test",
        query: "test query",
        limit: 10
      };

      const result = await handler(input);

      expect(result.success).toBe(true);
      expect(result.view.projectContext).toBeDefined();
      expect(Array.isArray(result.view.projectContext)).toBe(true);
    });
  });

  describe("往返一致性测试", () => {
    test("写入后验证内容哈希一致性", async () => {
      const content = "Round-trip consistency test content";

      const mockHub = {
        ingest: async (event: any) => {
          // 模拟一致的哈希生成
          const hash = `hash_${Buffer.from(event.payload.text).toString('base64').slice(0, 16)}`;
          return {
            success: true,
            eventId: `evt_${Date.now()}`,
            contentHash: hash
          };
        }
      };

      const handler = createIngestEventHandler(mockHub);

      // 第一次写入
      const event1 = {
        event: {
          source: "hermes",
          channel: "roundtrip-test",
          kind: "memory",
          projectId: "roundtrip-test",
          confidence: "reported",
          payload: {
            text: content,
            kind: "memory"
          }
        }
      };

      const result1 = await handler(event1);

      // 第二次写入相同内容
      const event2 = {
        event: {
          source: "ide",
          channel: "roundtrip-test",
          kind: "memory",
          projectId: "roundtrip-test",
          confidence: "observed",
          payload: {
            text: content,
            kind: "memory"
          }
        }
      };

      const result2 = await handler(event2);

      // 验证哈希一致性
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.contentHash).toBe(result2.contentHash);
    });

    test("写入后查询验证数据可用性", async () => {
      const writtenContent = "Content for write-read verification";

      // 写入阶段
      const mockHub = {
        ingest: async (event: any) => {
          return {
            success: true,
            eventId: `evt_${Date.now()}`,
            contentHash: `hash_${Date.now()}`,
            instruction: {
              success: true,
              data: {
                id: `id_${Date.now()}`,
                text: event.payload.text
              }
            }
          };
        }
      };

      const ingestHandler = createIngestEventHandler(mockHub);

      const writeEvent = {
        event: {
          source: "hermes",
          channel: "write-read-test",
          kind: "memory",
          projectId: "write-read-test",
          confidence: "reported",
          payload: {
            text: writtenContent,
            kind: "memory"
          }
        }
      };

      const writeResult = await ingestHandler(writeEvent);
      expect(writeResult.success).toBe(true);

      // 查询阶段
      const mockRuntime = {
        queryView: async () => {
          return {
            selfContext: [],
            projectContext: [{ object: { id: "retrieved_id", content: [{ text: writtenContent }] }, layer: "project" }],
            globalContext: [],
            conflictsOrGaps: [],
            sources: [],
            metadata: { policyId: "test" },
          };
        }
      };

      const queryHandler = createQueryHandler(mockRuntime as never);

      const queryInput = {
        view: "project_context",
        projectId: "write-read-test",
        query: "write-read verification",
        limit: 5
      };

      const queryResult = await queryHandler(queryInput);

      // 验证查询成功
      expect(queryResult.success).toBe(true);
      expect(queryResult.view.projectContext).toBeDefined();
      expect(queryResult.view.projectContext.length).toBeGreaterThan(0);
    });
  });

  describe("用户工作流场景", () => {
    test("场景：AI Agent 学习用户偏好", async () => {
      const mockHub = {
        ingest: async (event: any) => {
          return {
            success: true,
            eventId: `evt_${Date.now()}`,
            contentHash: `hash_${Date.now()}`,
            instruction: { success: true }
          };
        }
      };

      const handler = createIngestEventHandler(mockHub);

      // 模拟学习用户偏好
      const preferences = [
        "User prefers dark mode UI themes",
        "User often asks for keyboard shortcuts",
        "User likes minimal design"
      ];

      const results = await Promise.all(
        preferences.map((pref, i) =>
          handler({
            event: {
              source: "hermes",
              channel: "user-learning-session",
              kind: "memory",
              projectId: "agent-learning",
              confidence: "inferred",
              payload: {
                text: pref,
                kind: "memory",
                category: "user-preference"
              }
            }
          })
        )
      );

      // 验证所有偏好都被成功记录
      expect(results.length).toBe(preferences.length);
      expect(results.every(r => r.success)).toBe(true);
      expect(results.every(r => r.eventId)).toBeDefined();
    });

    test("场景：团队知识共享", async () => {
      const mockHub = {
        ingest: async (event: any) => {
          return {
            success: true,
            eventId: `evt_${Date.now()}`,
            contentHash: `hash_${Date.now()}`,
            instruction: { success: true }
          };
        }
      };

      const handler = createIngestEventHandler(mockHub);

      const teamDecision = {
        event: {
          source: "external",
          channel: "team-wiki",
          kind: "memory",
          projectId: "team-knowledge",
          confidence: "verified",
          payload: {
            text: "Team decision: Use TypeScript for all new frontend projects",
            kind: "memory",
            category: "team-decision",
            metadata: {
              approved_by: ["tech-lead", "product-manager"],
              meeting_date: new Date().toISOString()
            }
          }
        }
      };

      const result = await handler(teamDecision);

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
    });

    test("场景：跨会话上下文保持", async () => {
      const mockHub = {
        ingest: async (event: any) => {
          return {
            success: true,
            eventId: `evt_${Date.now()}`,
            contentHash: `hash_${Date.now()}`,
            instruction: { success: true }
          };
        }
      };

      const handler = createIngestEventHandler(mockHub);

      // 模拟多会话场景
      const conversations = [
        {
          sessionId: "project-alpha",
          messages: [
            "Discussed API architecture",
            "Decided on REST design"
          ]
        },
        {
          sessionId: "project-beta",
          messages: [
            "Reviewed database schema",
            "Planned optimization"
          ]
        }
      ];

      for (const conv of conversations) {
        for (const msg of conv.messages) {
          const result = await handler({
            event: {
              source: "hermes",
              channel: conv.sessionId,
              kind: "memory",
              projectId: "multi-context-test",
              confidence: "reported",
              payload: {
                text: msg,
                kind: "memory"
              }
            }
          });

          expect(result.success).toBe(true);
        }
      }
    });
  });

  describe("错误处理和边界情况", () => {
    test("网络中断恢复", async () => {
      let attemptCount = 0;
      const mockHub = {
        ingest: async (event: any) => {
          attemptCount++;
          // 模拟第一次失败，第二次成功
          if (attemptCount === 1) {
            throw new Error("Network timeout");
          }
          return {
            success: true,
            eventId: `evt_${Date.now()}`,
            contentHash: `hash_${Date.now()}`,
            instruction: { success: true }
          };
        }
      };

      const handler = createIngestEventHandler(mockHub);

      // 第一次尝试（失败）
      const event1 = {
        event: {
          source: "hermes",
          channel: "retry-test",
          kind: "memory",
          projectId: "network-test",
          confidence: "reported",
          payload: {
            text: "Content that should succeed after retry",
            kind: "memory"
          }
        }
      };

      try {
        let result = await handler(event1);
        // 第一次失败
        expect(result.success).toBe(false);
      } catch (error) {
        // 预期抛出错误
        expect(error).toBeDefined();
      }

      // 第二次尝试（成功）
      const event2 = {
        event: {
          ...event1.event
        }
      };

      const result = await handler(event2);

      // 第二次成功
      expect(result.success).toBe(true);
    });

    test("无效输入处理", async () => {
      const mockHub = {
        ingest: async () => ({ success: true, eventId: "test" })
      };

      const handler = createIngestEventHandler(mockHub);

      const invalidEvents = [
        {
          event: {
            // 缺少必需字段
            source: "hermes"
          }
        },
        {
          event: {
            source: "hermes",
            channel: "test",
            kind: "memory",
            projectId: "test",
            confidence: "invalid-confidence",
            payload: { text: "test" }
          }
        }
      ];

      for (const invalidEvent of invalidEvents) {
        const result = await handler(invalidEvent);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      }
    });
  });

  describe("性能和可扩展性", () => {
    test("批量操作性能", async () => {
      const mockHub = {
        ingest: async (event: any) => {
          return {
            success: true,
            eventId: `evt_${Date.now()}`,
            contentHash: `hash_${Date.now()}`,
            instruction: { success: true }
          };
        }
      };

      const handler = createIngestEventHandler(mockHub);

      const batchSize = 50;
      const events = Array.from({ length: batchSize }, (_, i) => ({
        event: {
          source: "cli",
          channel: "batch-perf",
          kind: "memory",
          projectId: "performance-test",
          confidence: "reported",
          payload: {
            text: `Batch event ${i}`,
            kind: "memory"
          }
        }
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        events.map(event => handler(event))
      );
      const duration = Date.now() - startTime;

      expect(results.length).toBe(batchSize);
      expect(results.every(r => r.success)).toBe(true);
      expect(duration).toBeLessThan(2000); // 2秒内完成
    });

    test("并发查询性能", async () => {
      const mockRuntime = {
        queryView: async (request: any) => {
          await new Promise(resolve => setTimeout(resolve, 10)); // 模拟延迟
          return {
            selfContext: Array.from({ length: request.limit || 5 }, (_, i) => ({ layer: "self", object: { id: `result_${i}` } })),
            projectContext: [],
            globalContext: [],
            conflictsOrGaps: [],
            sources: [],
            metadata: { policyId: "test" },
          };
        }
      };

      const handler = createQueryHandler(mockRuntime as never);

      const queries = Array.from({ length: 10 }, (_, i) => ({
        view: "project_context",
        projectId: "concurrent-test",
        query: `Query ${i}`,
        limit: 3
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        queries.map(query => handler(query))
      );
      const duration = Date.now() - startTime;

      expect(results.length).toBe(queries.length);
      expect(results.every(r => r.success)).toBe(true);
      expect(duration).toBeLessThan(1000); // 1秒内完成
    });
  });

  describe("Schema 验证和兼容性", () => {
    test("所有必需的事件字段验证", () => {
      const completeEvent = {
        event: {
          source: "hermes",
          channel: "test-channel",
          kind: "memory",
          projectId: "test-project",
          confidence: "reported",
          payload: {
            text: "Complete event with all fields",
            kind: "memory",
            file_path: "/path/to/file.ts",
            category: "test",
            tags: ["tag1", "tag2"],
            metadata: {
              extra: "data"
            }
          }
        }
      };

      const result = IngestEventInputSchema.safeParse(completeEvent);
      expect(result.success).toBe(true);
    });

    test("所有命名查询视图验证", () => {
      const queryTypes = [
        { view: "project_context", projectId: "test" },
        { view: "coding_context", projectId: "test" }
      ];

      queryTypes.forEach(query => {
        const result = QueryInputSchema.safeParse(query);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("系统集成验证", () => {
    test("MCP 工具端到端集成", () => {
      // 验证所有组件可以正确集成
      const mockHub = {
        ingest: async (event: any) => ({
          success: true,
          eventId: `evt_${Date.now()}`,
          contentHash: `hash_${Date.now()}`
        })
      };

      const mockRuntime = {
        queryView: async () => ({
          selfContext: [],
          projectContext: [],
          globalContext: [],
          conflictsOrGaps: [],
          sources: [],
          metadata: { policyId: "test" },
        })
      };

      const ingestHandler = createIngestEventHandler(mockHub);
      const queryHandler = createQueryHandler(mockRuntime as never);

      // 验证工具可以创建
      expect(ingestHandler).toBeDefined();
      expect(queryHandler).toBeDefined();

      // 验证工具可以调用
      expect(typeof ingestHandler).toBe("function");
      expect(typeof queryHandler).toBe("function");
    });

    test("完整的数据流验证", async () => {
      // 模拟完整的数据流：事件 → 摄取 → 查询
      let storedEvents: any[] = [];

      const mockHub = {
        ingest: async (event: any) => {
          storedEvents.push(event);
          return {
            success: true,
            eventId: `evt_${Date.now()}`,
            contentHash: `hash_${Date.now()}`
          };
        }
      };

      const mockRuntime = {
        queryView: async (request: any) => {
          // 返回存储的事件，模拟统一视图中的项目层上下文。
          return {
            selfContext: [],
            projectContext: storedEvents
              .filter(e => e.payload.text.includes(String(request.query).split(" ")[0]))
              .map(e => ({ layer: "project", object: { id: e.id, content: [{ text: e.payload.text }] } })),
            globalContext: [],
            conflictsOrGaps: [],
            sources: [],
            metadata: { policyId: "test" },
          };
        }
      };

      const ingestHandler = createIngestEventHandler(mockHub);
      const queryHandler = createQueryHandler(mockRuntime as never);

      // 写入数据
      await ingestHandler({
        event: {
          source: "hermes",
          channel: "dataflow-test",
          kind: "memory",
          projectId: "dataflow-test",
          confidence: "reported",
          payload: {
            text: "Important data for query test",
            kind: "memory"
          }
        }
      });

      // 查询数据
      const queryResult = await queryHandler({
        view: "project_context",
        projectId: "dataflow-test",
        query: "data for query",
        limit: 5
      });

      // 验证数据流
      expect(queryResult.success).toBe(true);
      expect(queryResult.view.projectContext).toBeDefined();
      expect(queryResult.view.projectContext.length).toBeGreaterThan(0);
    });
  });
});
