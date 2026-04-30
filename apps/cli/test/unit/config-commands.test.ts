import { mkdtemp, rm } from "node:fs/promises";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "bun:test";
import { ConfigLoader } from "@memohub/config";
import {
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
});
