import { mkdtemp, rm } from "node:fs/promises";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "bun:test";
import { CONFIG_UNINSTALL_CONFIRMATION, DATA_CLEAN_CONFIRMATION } from "../../../../src/config-commands.js";
import {
  ConfigManageInputSchema,
  DataManageInputSchema,
  createConfigManageHandler,
  createDataManageHandler,
} from "../../../../src/mcp/tools/config.js";

describe("MCP config manage tool", () => {
  let tempDir: string | undefined;
  const originalHome = process.env.HOME;

  afterEach(async () => {
    process.env.HOME = originalHome;
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  });

  test("supports confirmed config uninstall", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "memohub-mcp-config-"));
    process.env.HOME = tempDir;
    const configRoot = join(tempDir, ".memohub");
    mkdirSync(configRoot, { recursive: true });
    writeFileSync(join(configRoot, "memohub.json"), "{}", "utf8");

    const parsed = ConfigManageInputSchema.safeParse({ action: "uninstall", confirm: CONFIG_UNINSTALL_CONFIRMATION });
    expect(parsed.success).toBe(true);

    const result = await createConfigManageHandler()({ action: "uninstall", confirm: CONFIG_UNINSTALL_CONFIRMATION });

    expect(result.success).toBe(true);
    expect(result.removed).toContain(join(configRoot, "memohub.json"));
  });

  test("exposes dry-run data status and gates clean_all with confirmation", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "memohub-mcp-clean-"));
    process.env.HOME = tempDir;
    const staleData = join(tempDir, ".memohub", "data");
    mkdirSync(staleData, { recursive: true });
    writeFileSync(join(staleData, "stale.txt"), "old data", "utf8");
    const handler = createDataManageHandler();

    const status = await handler({ action: "status" });
    expect(status.success).toBe(true);
    expect(status.dryRun).toBe(true);
    expect(existsSync(staleData)).toBe(true);

    const refused = await handler({ action: "clean_all", confirm: "WRONG" });
    expect(refused.success).toBe(false);
    expect(existsSync(staleData)).toBe(true);

    const deleted = await handler({ action: "clean_all", confirm: DATA_CLEAN_CONFIRMATION });
    expect(deleted.success).toBe(true);
    expect(existsSync(staleData)).toBe(false);
  });

  test("supports channel-scoped cleanup through runtime vector store", async () => {
    let deletedFilter = "";
    const channels = new Map([["hermes:mcp-test", { channelId: "hermes:mcp-test" }]]);
    const runtime = {
      getChannel(channelId: string) {
        return channels.get(channelId);
      },
      vectorStore: {
        async list(filter: string) {
          return filter === "channel = 'hermes:mcp-test'" ? [{ id: "rec-1" }] : [];
        },
        async delete(filter: string) {
          deletedFilter = filter;
        },
      },
    };
    const handler = createDataManageHandler(runtime as never);

    const dryRun = await handler({ action: "clean_channel", channel: "hermes:mcp-test" });
    expect(dryRun.success).toBe(true);
    expect(dryRun.dryRun).toBe(true);
    expect(dryRun.matchedRecords).toBe(1);
    expect(deletedFilter).toBe("");

    const deleted = await handler({
      action: "clean_channel",
      channel: "hermes:mcp-test",
      dryRun: false,
      confirm: DATA_CLEAN_CONFIRMATION,
    });
    expect(deleted.success).toBe(true);
    expect(deleted.deletedRecords).toBe(1);
    expect(deletedFilter).toBe("channel = 'hermes:mcp-test'");
  });

  test("refuses channel cleanup when channel is not registered", async () => {
    const runtime = {
      getChannel() {
        return undefined;
      },
      vectorStore: {
        async list() {
          return [];
        },
        async delete() {},
      },
    };
    const handler = createDataManageHandler(runtime as never);

    const result = await handler({ action: "clean_channel", channel: "unknown:channel" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Unknown channel");
  });

  test("accepts rebuild_schema action for data recovery", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "memohub-mcp-rebuild-"));
    process.env.HOME = tempDir;
    const staleData = join(tempDir, ".memohub", "data");
    mkdirSync(staleData, { recursive: true });
    writeFileSync(join(staleData, "stale.txt"), "old schema", "utf8");

    const parsed = DataManageInputSchema.safeParse({ action: "rebuild_schema", confirm: DATA_CLEAN_CONFIRMATION });
    expect(parsed.success).toBe(true);

    const refused = await createDataManageHandler()({ action: "rebuild_schema" });
    expect(refused.success).toBe(false);

    const result = await createDataManageHandler()({ action: "rebuild_schema", confirm: DATA_CLEAN_CONFIRMATION });
    expect(result.success).toBe(true);
    expect(result.action).toBe("rebuild_schema");
    expect(result.message).toContain("Restart");
  });
});
