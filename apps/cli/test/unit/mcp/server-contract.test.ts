import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";

const source = readFileSync(join(import.meta.dir, "../../../src/mcp.ts"), "utf8");

describe("MCP server tool contract", () => {
  test("ingest and query tools return MCP content envelopes", () => {
    expect(source).toContain("function textResult");
    expect(source).toContain("return textResult(result);");
  });

  test("ingest registration accepts payload tags and metadata", () => {
    expect(source).toContain("tags: z.array(z.string()).optional()");
    expect(source).toContain("metadata: z.record(z.any()).optional()");
  });

  test("ingest and query tool calls are logged", () => {
    expect(source).toContain('event: "mcp.ingest_event.request"');
    expect(source).toContain('event: "mcp.ingest_event.result"');
    expect(source).toContain('event: "mcp.query.request"');
    expect(source).toContain('event: "mcp.query.result"');
  });

  test("config and data manage server schemas expose split governance actions", () => {
    expect(source).toContain('z.enum(["check", "uninstall"])');
    expect(source).toContain('z.enum(["status", "clean_all", "clean_channel", "rebuild_schema"])');
  });
});
