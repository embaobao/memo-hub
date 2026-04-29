import { describe, expect, test } from "bun:test";
import {
  createResolveClarificationHandler,
  ResolveClarificationInputSchema,
} from "../../../../src/mcp/tools/resolve-clarification.js";

describe("MCP Resolve Clarification Tool", () => {
  test("writes clarification answer through runtime", async () => {
    let received: unknown;
    const handler = createResolveClarificationHandler({
      resolveClarification: async (input: unknown) => {
        received = input;
        return {
          success: true,
          clarification: { id: "clarify-1", status: "resolved" },
          memoryObject: { id: "mem-resolved" },
          vectorRecordCount: 1,
        };
      },
    } as never);

    const result = await handler({
      clarificationId: "clarify-1",
      answer: "以新架构为准",
      resolvedBy: "hermes",
      projectId: "memo-hub",
      memoryIds: ["mem-a"],
    });

    expect(result.success).toBe(true);
    expect(received).toMatchObject({
      clarificationId: "clarify-1",
      answer: "以新架构为准",
      resolvedBy: "hermes",
    });
  });

  test("rejects invalid input", () => {
    expect(ResolveClarificationInputSchema.safeParse({ answer: "" }).success).toBe(false);
  });
});
