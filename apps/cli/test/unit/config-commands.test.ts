import { mkdtemp, rm } from "node:fs/promises";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "bun:test";
import { ConfigLoader } from "@memohub/config";
import {
  cleanManagedData,
  DATA_CLEAN_CONFIRMATION,
  getConfigValue,
  parseConfigValue,
  resetGlobalConfig,
  setConfigValue,
  writeConfigValue,
} from "../../src/config-commands.js";

describe("CLI config commands", () => {
  let tempDir: string | undefined;

  afterEach(async () => {
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  });

  test("reads and writes dotted config paths", () => {
    const config: Record<string, any> = { mcp: { logPath: "/tmp/old.ndjson" } };
    expect(getConfigValue(config, "mcp.logPath")).toBe("/tmp/old.ndjson");

    setConfigValue(config, "mcp.logPath", "/tmp/new.ndjson");
    setConfigValue(config, "storage.vectorTable", "memohub_test");

    expect(config.mcp.logPath).toBe("/tmp/new.ndjson");
    expect(config.storage.vectorTable).toBe("memohub_test");
  });

  test("parses JSON values before config write", () => {
    expect(parseConfigValue("true")).toBe(true);
    expect(parseConfigValue("123")).toBe(123);
    expect(parseConfigValue('["project_context"]')).toEqual(["project_context"]);
    expect(parseConfigValue("/tmp/mcp.ndjson")).toBe("/tmp/mcp.ndjson");
  });

  test("persists config changes through ConfigLoader", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "memohub-config-"));
    const configPath = join(tempDir, "memohub.json");
    const loader = new ConfigLoader(configPath);

    const result = writeConfigValue("mcp.logPath", '"/tmp/memohub-test.ndjson"', loader);
    const reloaded = new ConfigLoader(configPath).getConfig();

    expect(result).toEqual({ path: "mcp.logPath", value: "/tmp/memohub-test.ndjson" });
    expect(reloaded.mcp.logPath).toBe("/tmp/memohub-test.ndjson");
  });

  test("resetGlobalConfig removes managed data directories before first integration", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "memohub-reset-"));
    const configPath = join(tempDir, "memohub.json");
    const managedDirs = ["tracks", "data", "blobs", "logs", "cache"];

    for (const dir of managedDirs) {
      const target = join(tempDir, dir);
      mkdirSync(target, { recursive: true });
      writeFileSync(join(target, "stale.txt"), "stale test data", "utf8");
    }

    const result = resetGlobalConfig(configPath);

    expect(existsSync(configPath)).toBe(true);
    for (const dir of managedDirs) {
      expect(existsSync(join(tempDir, dir))).toBe(false);
    }
    expect(result.removed).toEqual(managedDirs.map((dir) => join(tempDir, dir)));
  });

  test("resetGlobalConfig returns explicit schema rebuild recovery paths", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "memohub-schema-reset-"));
    const configPath = join(tempDir, "memohub.json");

    const result = resetGlobalConfig(configPath);

    expect(result.removed).toContain(join(tempDir, "data"));
    expect(result.configPath).toBe(configPath);
    expect(existsSync(configPath)).toBe(true);
  });

  test("cleanManagedData defaults to dry-run and requires second confirmation", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "memohub-data-clean-"));
    const configPath = join(tempDir, "memohub.json");
    const dataDir = join(tempDir, "data");
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(join(dataDir, "record.txt"), "keep", "utf8");

    const dryRun = cleanManagedData({ configPath, all: true });
    expect(dryRun.success).toBe(true);
    expect(dryRun.dryRun).toBe(true);
    expect(existsSync(dataDir)).toBe(true);

    const refused = cleanManagedData({ configPath, all: true, yes: true, confirm: "WRONG", dryRun: false });
    expect(refused.success).toBe(false);
    expect(existsSync(dataDir)).toBe(true);

    const deleted = cleanManagedData({
      configPath,
      all: true,
      yes: true,
      confirm: DATA_CLEAN_CONFIRMATION,
      dryRun: false,
    });
    expect(deleted.success).toBe(true);
    expect(deleted.dryRun).toBe(false);
    expect(existsSync(dataDir)).toBe(false);
  });

  test("cleanChannelData previews and deletes only the requested channel", async () => {
    const { cleanChannelData } = await import("../../src/config-commands.js");
    const vector = {
      deletedFilter: "",
      async list(filter: string) {
        return filter === "channel = 'hermes:mcp-test'"
          ? [{ id: "rec-1" }, { id: "rec-2" }]
          : [];
      },
      async delete(filter: string) {
        this.deletedFilter = filter;
      },
    };

    const dryRun = await cleanChannelData(vector as never, { channel: "hermes:mcp-test" });
    expect(dryRun.success).toBe(true);
    expect(dryRun.dryRun).toBe(true);
    expect(dryRun.matchedRecords).toBe(2);
    expect(vector.deletedFilter).toBe("");

    const refused = await cleanChannelData(vector as never, {
      channel: "hermes:mcp-test",
      dryRun: false,
      yes: true,
      confirm: "WRONG",
    });
    expect(refused.success).toBe(false);
    expect(vector.deletedFilter).toBe("");

    const deleted = await cleanChannelData(vector as never, {
      channel: "hermes:mcp-test",
      dryRun: false,
      yes: true,
      confirm: DATA_CLEAN_CONFIRMATION,
    });
    expect(deleted.success).toBe(true);
    expect(deleted.deletedRecords).toBe(2);
    expect(vector.deletedFilter).toBe("channel = 'hermes:mcp-test'");
  });

  test("cleanChannelData reports old schema without deleting", async () => {
    const { cleanChannelData } = await import("../../src/config-commands.js");
    const vector = {
      deleteCalled: false,
      async list() {
        throw new Error("Schema error: No field named channel. Valid fields are id, vector.");
      },
      async delete() {
        this.deleteCalled = true;
      },
    };

    const result = await cleanChannelData(vector as never, {
      channel: "hermes:mcp-test",
      dryRun: false,
      yes: true,
      confirm: DATA_CLEAN_CONFIRMATION,
    });

    expect(result.success).toBe(false);
    expect(result.schemaMismatch).toBe(true);
    expect(result.destructive).toBe(false);
    expect(vector.deleteCalled).toBe(false);
  });
});
