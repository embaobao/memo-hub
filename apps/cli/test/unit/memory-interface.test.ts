import { describe, expect, test } from "bun:test";
import {
  buildMemoryEvent,
  ingestMemory,
  queryMemoryView,
  runAgentOperation,
} from "../../src/memory-interface.js";
import {
  EventConfidence,
  EventKind,
  EventSource,
} from "@memohub/protocol";

describe("CLI/MCP shared memory interface", () => {
  test("buildMemoryEvent 不再接受 trackId，并填充统一事件字段", () => {
    const event = buildMemoryEvent({
      text: "Source memory",
      source: EventSource.CLI,
      channel: "cli-command",
      projectId: "memo-hub",
      confidence: EventConfidence.REPORTED,
      filePath: "src/index.ts",
      category: "code",
    });

    expect(event.source).toBe(EventSource.CLI);
    expect(event.channel).toBe("cli-command");
    expect(event.kind).toBe(EventKind.MEMORY);
    expect(event.projectId).toBe("memo-hub");
    expect(event.payload).toMatchObject({
      text: "Source memory",
      file_path: "src/index.ts",
      category: "code",
      metadata: {},
    });
  });

  test("ingestMemory 统一走 runtime.ingest", async () => {
    let receivedEvent: unknown;
    const runtime = {
      ingest: async (event: unknown) => {
        receivedEvent = event;
        return {
          success: true,
          eventId: "evt_test",
          contentHash: "hash_test",
        };
      },
    };

    const result = await ingestMemory(runtime, {
      text: "Remember this",
      metadata: { sourceId: "cli" },
    });

    expect(result.success).toBe(true);
    expect(receivedEvent).toMatchObject({
      source: EventSource.CLI,
      payload: {
        metadata: {
          sourceId: "cli",
        },
      },
    });
  });

  test("buildMemoryEvent 保留 Hermes 来源用于 self 层身份绑定", () => {
    const event = buildMemoryEvent({
      text: "Hermes prefers reading memohub://tools before querying.",
      source: EventSource.HERMES,
      channel: "cli-command",
      projectId: "memo-hub",
      category: "habit-convention",
      metadata: { sourceId: "hermes" },
    });

    expect(event.source).toBe(EventSource.HERMES);
    expect(event.channel).toBe("cli-command");
    expect(event.payload).toMatchObject({
      category: "habit-convention",
      metadata: { sourceId: "hermes" },
    });
  });

  test("buildMemoryEvent 保留 sessionId 和 taskId 供渠道治理与召回使用", () => {
    const event = buildMemoryEvent({
      text: "Hermes session memory",
      source: EventSource.HERMES,
      channel: "hermes:session:memo-hub:docs",
      projectId: "memo-hub",
      sessionId: "session:2026-04-30-hermes-docs",
      taskId: "task:channel-registry",
    });

    expect(event.sessionId).toBe("session:2026-04-30-hermes-docs");
    expect(event.taskId).toBe("task:channel-registry");
  });

  test("queryMemoryView 委托统一运行时生成分层视图", async () => {
    let receivedRequest: unknown;
    const runtime = {
      queryView: async (request: unknown) => {
        receivedRequest = request;
        return {
          selfContext: [{ layer: "self" }],
          projectContext: [{ layer: "project" }],
          globalContext: [{ layer: "global" }],
        };
      },
    };

    const view = await queryMemoryView(runtime as never, {
      view: "agent_profile",
      actorId: "hermes",
      projectId: "memo-hub",
      query: "habits",
      limit: 3,
      source: EventSource.CLI,
    });

    expect(receivedRequest).toMatchObject({ view: "agent_profile", actorId: "hermes" });
    expect((view as any).selfContext[0].layer).toBe("self");
    expect((view as any).projectContext[0].layer).toBe("project");
    expect((view as any).globalContext[0].layer).toBe("global");
  });

  test("runAgentOperation 暴露 summarize 和 clarify 的治理结果", async () => {
    const summary = await runAgentOperation({ type: "summarize", text: "Recent Hermes activity", sourceAgentId: "hermes" });
    const clarification = await runAgentOperation({ type: "clarify", text: "Conflicting convention", sourceAgentId: "hermes" });

    expect(summary.outputs[0].provenance.operationId).toBeDefined();
    expect(summary.reviewState).toBe("proposed");
    expect(clarification.clarifications[0].reason).toBe("conflict");
  });
});
