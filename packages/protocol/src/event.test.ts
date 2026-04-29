import { describe, test, expect } from "bun:test";
import {
  EventSource,
  EventKind,
  EventConfidence,
  MemoHubEvent,
  MemoryEventPayload,
  validateMemoHubEventBasic
} from "./event.js";
import {
  IntegrationErrorCode,
  IntegrationHubError,
  ValidationError
} from "./errors.js";

describe("Event Protocol", () => {
  describe("EventSource", () => {
    test("应该包含所有预期的源类型", () => {
      expect(EventSource.HERMES).toBe("hermes");
      expect(EventSource.IDE).toBe("ide");
      expect(EventSource.CLI).toBe("cli");
      expect(EventSource.MCP).toBe("mcp");
      expect(EventSource.EXTERNAL).toBe("external");
    });
  });

  describe("EventKind", () => {
    test("MVP 应该只支持 memory 类型", () => {
      expect(EventKind.MEMORY).toBe("memory");
    });
  });

  describe("EventConfidence", () => {
    test("应该包含所有置信度级别", () => {
      expect(EventConfidence.REPORTED).toBe("reported");
      expect(EventConfidence.OBSERVED).toBe("observed");
      expect(EventConfidence.INFERRED).toBe("inferred");
      expect(EventConfidence.PROVISIONAL).toBe("provisional");
      expect(EventConfidence.VERIFIED).toBe("verified");
    });
  });

  describe("validateMemoHubEventBasic", () => {
    test("应该验证有效的 memory 事件", () => {
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

      const result = validateMemoHubEventBasic(event);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("应该拒绝缺少必需字段的事件", () => {
      const incompleteEvent = {
        source: EventSource.HERMES
        // 缺少其他必需字段
      } as Partial<MemoHubEvent>;

      const result = validateMemoHubEventBasic(incompleteEvent);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain("Missing required field: channel");
      expect(result.errors).toContain("Missing required field: kind");
      expect(result.errors).toContain("Missing required field: projectId");
      expect(result.errors).toContain("Missing required field: confidence");
      expect(result.errors).toContain("Missing required field: payload");
    });

    test("应该拒绝无效的 source 值", () => {
      const event = {
        source: "invalid-source",
        channel: "test-channel",
        kind: EventKind.MEMORY,
        projectId: "test-project",
        confidence: EventConfidence.REPORTED,
        payload: { text: "Test" }
      } as unknown;

      const result = validateMemoHubEventBasic(event);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("Invalid source"))).toBe(true);
    });

    test("应该拒绝无效的 kind 值", () => {
      const event = {
        source: EventSource.HERMES,
        channel: "test-channel",
        kind: "invalid-kind",
        projectId: "test-project",
        confidence: EventConfidence.REPORTED,
        payload: { text: "Test" }
      } as unknown;

      const result = validateMemoHubEventBasic(event);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("Invalid kind"))).toBe(true);
    });

    test("应该拒绝 memory 事件缺少 payload.text", () => {
      const event = {
        source: EventSource.HERMES,
        channel: "test-channel",
        kind: EventKind.MEMORY,
        projectId: "test-project",
        confidence: EventConfidence.REPORTED,
        payload: {} // 缺少 text
      } as unknown;

      const result = validateMemoHubEventBasic(event);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("must have a 'text' field"))).toBe(true);
    });

    test("应该接受带有可选字段的完整事件", () => {
      const event: MemoHubEvent = {
        id: "test-event-id",
        source: EventSource.HERMES,
        channel: "test-channel",
        kind: EventKind.MEMORY,
        projectId: "test-project",
        sessionId: "test-session",
        taskId: "test-task",
        repo: "test-repo",
        confidence: EventConfidence.REPORTED,
        occurredAt: "2026-04-29T12:00:00Z",
        payload: {
          text: "Test memory content",
          tags: ["test", "example"],
          metadata: { key: "value" }
        }
      };

      const result = validateMemoHubEventBasic(event);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});

describe("IntegrationHubError", () => {
  test("应该创建基本的错误", () => {
    const error = new IntegrationHubError(
      "Test error message",
      IntegrationErrorCode.INVALID_EVENT
    );

    expect(error.message).toBe("Test error message");
    expect(error.code).toBe(IntegrationErrorCode.INVALID_EVENT);
    expect(error.name).toBe("IntegrationHubError");
  });

  test("应该创建带有 details 的错误", () => {
    const details = { field: "test", value: "invalid" };
    const error = new IntegrationHubError(
      "Test error",
      IntegrationErrorCode.INVALID_FIELD_VALUE,
      details
    );

    expect(error.details).toEqual(details);
  });

  test("应该使用工厂方法创建特定错误", () => {
    const invalidEventError = IntegrationHubError.invalidEvent(["Field A is missing", "Field B is invalid"]);
    expect(invalidEventError.code).toBe(IntegrationErrorCode.INVALID_EVENT);
    expect(invalidEventError.details).toEqual({ errors: ["Field A is missing", "Field B is invalid"] });

    const missingFieldError = IntegrationHubError.missingField("projectId");
    expect(missingFieldError.code).toBe(IntegrationErrorCode.MISSING_REQUIRED_FIELD);
    expect(missingFieldError.details).toEqual({ field: "projectId" });

    const unsupportedKindError = IntegrationHubError.unsupportedKind("unknown", ["memory"]);
    expect(unsupportedKindError.code).toBe(IntegrationErrorCode.UNSUPPORTED_KIND);
    expect(unsupportedKindError.details).toEqual({ kind: "unknown", supported: ["memory"] });
  });

  test("应该正确序列化为 JSON", () => {
    const error = IntegrationHubError.missingField("testField");
    const json = error.toJSON();

    expect(json).toHaveProperty("name", "IntegrationHubError");
    expect(json).toHaveProperty("code", IntegrationErrorCode.MISSING_REQUIRED_FIELD);
    expect(json).toHaveProperty("message");
    expect(json).toHaveProperty("details");
    expect(json).toHaveProperty("stack");
  });
});

describe("ValidationError", () => {
  test("应该创建验证错误", () => {
    const errors = ["Error 1", "Error 2", "Error 3"];
    const error = new ValidationError(errors);

    expect(error.code).toBe(IntegrationErrorCode.INVALID_EVENT);
    expect(error.validationErrors).toEqual(errors);
    expect(error.message).toContain("Error 1");
    expect(error.message).toContain("Error 2");
    expect(error.message).toContain("Error 3");
  });
});

describe("ErrorFormatter", () => {
  test("应该格式化错误为用户友好的消息", () => {
    const error = IntegrationHubError.missingField("projectId");
    const formatted = error.message;

    expect(formatted).toContain("Missing required field");
    expect(formatted).toContain("projectId");
  });

  test("应该格式化错误为 JSON", () => {
    const error = IntegrationHubError.missingField("testField");
    const json = error.toJSON();

    expect(typeof json).toBe("object");
    expect(json).toHaveProperty("code");
    expect(json).toHaveProperty("message");
  });
});
