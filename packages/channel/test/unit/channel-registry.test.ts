import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "bun:test";
import { ChannelRegistry } from "../../src/index.js";

describe("channel registry", () => {
  let tempDir: string | undefined;

  afterEach(async () => {
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  });

  test("reuses primary channel for the same actor and workspace binding", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "memohub-channel-"));
    const registry = new ChannelRegistry(join(tempDir, "channels.json"));

    const first = registry.open({
      actorId: "hermes",
      source: "hermes",
      purpose: "primary",
      projectId: "memo-hub",
      workspaceId: "repo:memo-hub",
      isPrimary: true,
    });
    const second = registry.open({
      actorId: "hermes",
      source: "hermes",
      purpose: "primary",
      projectId: "memo-hub",
      workspaceId: "repo:memo-hub",
      isPrimary: true,
    });

    expect(first.reused).toBe(false);
    expect(second.reused).toBe(true);
    expect(second.entry.channelId).toBe(first.entry.channelId);
    expect(registry.list()).toHaveLength(1);
  });

  test("auto binds IDE workspace channel without explicit registration step", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "memohub-channel-ide-"));
    const registry = new ChannelRegistry(join(tempDir, "channels.json"));

    const result = registry.autoBindWorkspaceChannel({
      source: "vscode",
      projectId: "memo-hub",
      workspaceId: "repo:memo-hub",
    });

    expect(result.entry.channelId).toBe("vscode:workspace:memo-hub");
    expect(result.entry.metadata.autoBound).toBe(true);
  });

  test("close marks channel closed and use reactivates it", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "memohub-channel-close-"));
    const registry = new ChannelRegistry(join(tempDir, "channels.json"));
    const opened = registry.open({
      actorId: "hermes",
      source: "hermes",
      purpose: "test",
      projectId: "memo-hub",
      channelId: "hermes:test:memo-hub:manual",
    });

    const closed = registry.close(opened.entry.channelId);
    const reused = registry.use(opened.entry.channelId);

    expect(closed.status).toBe("closed");
    expect(reused.status).toBe("active");
  });
});
