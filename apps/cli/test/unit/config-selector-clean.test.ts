import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "bun:test";
import { ChannelRegistry } from "@memohub/channel";
import { cleanChannelsBySelector } from "../../src/config-commands.js";

describe("selector-based channel cleanup", () => {
  let tempDir: string | undefined;

  afterEach(async () => {
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  });

  test("supports cleaning Hermes test channels by selector instead of explicit channel id", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "memohub-selector-clean-"));
    const registry = new ChannelRegistry(join(tempDir, "channels.json"));

    registry.open({
      actorId: "hermes",
      source: "hermes",
      purpose: "test",
      projectId: "memo-hub",
      channelId: "hermes:test:memo-hub:first-onboarding",
    });
    registry.open({
      actorId: "hermes",
      source: "hermes",
      purpose: "primary",
      projectId: "memo-hub",
      channelId: "hermes:primary:memo-hub",
      isPrimary: true,
    });

    const runtime = {
      listChannels: (filters: Record<string, unknown>) => registry.list(filters as never),
      vectorStore: {
        async list(filter: string) {
          return filter.includes("hermes:test:memo-hub:first-onboarding") ? [{ id: "rec-1" }] : [];
        },
        async delete() {},
      },
    };

    const result = await cleanChannelsBySelector(runtime as never, {
      actorId: "hermes",
      purpose: "test",
      dryRun: true,
    });

    expect(result.success).toBe(true);
    expect(result.matchedChannels).toBe(1);
    expect(result.matchedRecords).toBe(1);
    expect((result.channels as Array<Record<string, unknown>>)[0]?.channelId).toBe("hermes:test:memo-hub:first-onboarding");
  });
});
