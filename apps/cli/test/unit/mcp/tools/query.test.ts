import { beforeEach, describe, expect, test } from "bun:test";
import { createQueryHandler, QueryInputSchema } from "../../../../src/mcp/tools/query.js";

describe("MCP Query Tool", () => {
  let receivedRequest: unknown;
  let queryHandler: ReturnType<typeof createQueryHandler>;

  beforeEach(() => {
    const runtime = {
      queryView: async (request: unknown) => {
        receivedRequest = request;
        return {
          view: "agent_profile",
          selfContext: [{ layer: "self" }],
          projectContext: [{ layer: "project" }],
          globalContext: [{ layer: "global" }],
          conflictsOrGaps: [],
          sources: [],
          metadata: { policyId: "test" },
        };
      },
    };

    queryHandler = createQueryHandler(runtime as never);
  });

  test("应该成功执行命名 view 查询并保留分层结构", async () => {
    const result = await queryHandler({
      view: "agent_profile",
      actorId: "hermes",
      projectId: "test-project",
      query: "habits",
      limit: 3,
    });

    expect(result.success).toBe(true);
    expect(result.view.selfContext[0].layer).toBe("self");
    expect(result.view.projectContext[0].layer).toBe("project");
    expect(result.view.globalContext[0].layer).toBe("global");
    expect(receivedRequest).toMatchObject({
      view: "agent_profile",
      actorId: "hermes",
      projectId: "test-project",
    });
  });

  test("应该支持 sessionId、taskId 和 workspaceId 过滤输入", async () => {
    const result = await queryHandler({
      view: "recent_activity",
      projectId: "test-project",
      workspaceId: "workspace-1",
      sessionId: "session-123",
      taskId: "task-456",
      query: "test",
      limit: 5,
    });

    expect(result.success).toBe(true);
    expect(receivedRequest).toMatchObject({
      workspaceId: "workspace-1",
      sessionId: "session-123",
      taskId: "task-456",
    });
  });

  test("应该拒绝旧 type 查询形式", async () => {
    const result = await queryHandler({
      type: "memory",
      projectId: "test-project",
    } as never);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid input schema");
  });

  test("应该验证新架构 schema", () => {
    const result = QueryInputSchema.safeParse({
      view: "project_context",
      actorId: "hermes",
      projectId: "test-project",
      query: "layered context",
      limit: 10,
    });

    expect(result.success).toBe(true);
  });

  test("应该在缺少 projectId 时继承当前绑定渠道上下文", async () => {
    const handler = createQueryHandler({
      queryView: async (request: unknown) => {
        receivedRequest = request;
        return {
          selfContext: [],
          projectContext: [],
          globalContext: [],
        };
      },
    } as never, {
      channelId: "hermes:primary:memo-hub",
      actorId: "hermes",
      source: "hermes",
      projectId: "memo-hub",
      workspaceId: "repo:memo-hub",
      purpose: "primary",
    });

    const result = await handler({
      view: "project_context",
      query: "current project facts",
    });

    expect(result.success).toBe(true);
    expect(receivedRequest).toMatchObject({
      actorId: "hermes",
      projectId: "memo-hub",
      workspaceId: "repo:memo-hub",
    });
  });

  test("应该在没有绑定上下文且未传 projectId 时返回错误", async () => {
    const result = await queryHandler({
      view: "project_context",
      query: "current project facts",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Missing projectId");
  });
});
