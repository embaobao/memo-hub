import { describe, test, expect } from "bun:test";

describe("MCP Tools Basic Integration Tests", () => {
  describe("工具可用性测试", () => {
    test("ingest 工具函数可导入", () => {
      const { createIngestEventHandler } = require("./tools/ingest.js");
      expect(createIngestEventHandler).toBeDefined();
      expect(typeof createIngestEventHandler).toBe("function");
    });

    test("query 工具函数可导入", () => {
      const { createQueryHandler } = require("./tools/query.js");
      expect(createQueryHandler).toBeDefined();
      expect(typeof createQueryHandler).toBe("function");
    });

    test("ingest 输入 schema 可验证", () => {
      const { IngestEventInputSchema } = require("./tools/ingest.js");
      const validInput = {
        event: {
          source: "hermes",
          channel: "test",
          kind: "memory",
          projectId: "test",
          confidence: "reported",
          payload: {
            text: "Test content"
          }
        }
      };

      const result = IngestEventInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    test("query 输入 schema 可验证", () => {
      const { QueryInputSchema } = require("./tools/query.js");
      const validInput = {
        type: "memory",
        projectId: "test",
        query: "test query",
        limit: 10
      };

      const result = QueryInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });

  describe("基本功能测试", () => {
    test("ingest 工具元数据正确", () => {
      const { INGEST_TOOL_METADATA } = require("./tools/ingest.js");
      expect(INGEST_TOOL_METADATA).toBeDefined();
      expect(INGEST_TOOL_METADATA.name).toBe("memohub_ingest_event");
      expect(INGEST_TOOL_METADATA.inputSchema).toBeDefined();
    });

    test("query 工具元数据正确", () => {
      const { QUERY_TOOL_METADATA } = require("./tools/query.js");
      expect(QUERY_TOOL_METADATA).toBeDefined();
      expect(QUERY_TOOL_METADATA.name).toBe("memohub_query");
      expect(QUERY_TOOL_METADATA.inputSchema).toBeDefined();
    });

    test("ingest 工具处理程序可创建", () => {
      const { createIngestEventHandler } = require("./tools/ingest.js");
      const mockHub = {
        ingest: async () => ({ success: true, eventId: "test" })
      };

      const handler = createIngestEventHandler(mockHub);
      expect(handler).toBeDefined();
      expect(typeof handler).toBe("function");
    });

    test("query 工具处理程序可创建", () => {
      const { createQueryHandler } = require("./tools/query.js");
      const mockKernel = {
        dispatch: async () => ({ success: true, data: [] })
      };

      const handler = createQueryHandler(mockKernel);
      expect(handler).toBeDefined();
      expect(typeof handler).toBe("function");
    });
  });

  describe("错误处理测试", () => {
    test("ingest 工具拒绝无效输入", async () => {
      const { createIngestEventHandler } = require("./tools/ingest.js");
      const mockHub = {
        ingest: async () => ({ success: true, eventId: "test" })
      };

      const handler = createIngestEventHandler(mockHub);
      const invalidInput = {
        event: {
          // 缺少必需字段
          source: "hermes"
          // 缺少 channel, kind, projectId, confidence, payload
        }
      };

      const result = await handler(invalidInput);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("query 工具拒绝无效输入", async () => {
      const { createQueryHandler } = require("./tools/query.js");
      const mockKernel = {
        dispatch: async () => ({ success: true, data: [] })
      };

      const handler = createQueryHandler(mockKernel);
      const invalidInput = {
        type: "invalid-type"
      };

      const result = await handler(invalidInput);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("Schema 验证测试", () => {
    test("ingest schema 验证所有必需字段", () => {
      const { IngestEventInputSchema } = require("./tools/ingest.js");

      // 测试缺少每个必需字段
      const requiredFields = ["source", "channel", "kind", "projectId", "confidence", "payload"];

      requiredFields.forEach(field => {
        const incompleteInput = {
          event: {
            source: "hermes",
            channel: "test",
            kind: "memory",
            projectId: "test",
            confidence: "reported",
            payload: {
              text: "test"
            }
          }
        };

        // 移除当前字段
        delete (incompleteInput.event as any)[field];

        const result = IngestEventInputSchema.safeParse(incompleteInput);
        expect(result.success).toBe(false);
      });
    });

    test("query schema 验证必需字段", () => {
      const { QueryInputSchema } = require("./tools/query.js");

      // 测试缺少 type 和 projectId
      const missingType = {
        projectId: "test"
      };

      const missingProjectId = {
        type: "memory"
      };

      const result1 = QueryInputSchema.safeParse(missingType);
      const result2 = QueryInputSchema.safeParse(missingProjectId);

      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
    });
  });

  describe("数据结构测试", () => {
    test("ingest 事件结构正确", () => {
      const { IngestEventInputSchema } = require("./tools/ingest.js");

      const validEvent = {
        event: {
          source: "hermes",
          channel: "session-123",
          kind: "memory",
          projectId: "my-project",
          confidence: "reported",
          payload: {
            text: "Test content with various chars: @#$%^&*",
            kind: "memory",
            category: "test",
            metadata: {
              extra: "data"
            }
          }
        }
      };

      const result = IngestEventInputSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    test("query 查询结构正确", () => {
      const { QueryInputSchema } = require("./tools/query.js");

      const validQueries = [
        {
          type: "memory",
          projectId: "test",
          query: "search query",
          limit: 5
        },
        {
          type: "coding_context",
          projectId: "test",
          sessionId: "session-123",
          taskId: "task-456",
          query: "complex query",
          limit: 20
        }
      ];

      validQueries.forEach(query => {
        const result = QueryInputSchema.safeParse(query);
        expect(result.success).toBe(true);
      });
    });
  });
});
