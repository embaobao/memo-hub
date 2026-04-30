import { describe, expect, test } from "bun:test";
import {
  createChannelCloseHandler,
  createChannelListHandler,
  createChannelOpenHandler,
  createChannelStatusHandler,
  createChannelUseHandler,
} from "../../../../src/mcp/tools/channel.js";

describe("MCP channel tools", () => {
  test("opens and lists governed channels", async () => {
    const entries: any[] = [];
    const runtime = {
      openChannel(input: any) {
        const entry = { channelId: input.channelId ?? "hermes:primary:memo-hub", ...input, status: "active" };
        entries.push(entry);
        return { reused: false, entry };
      },
      listChannels() {
        return entries;
      },
      getChannel(channelId: string) {
        return entries.find((entry) => entry.channelId === channelId);
      },
      useChannel(channelId: string) {
        const entry = entries.find((item) => item.channelId === channelId);
        entry.status = "active";
        return entry;
      },
      closeChannel(channelId: string) {
        const entry = entries.find((item) => item.channelId === channelId);
        entry.status = "closed";
        return entry;
      },
    };

    const open = await createChannelOpenHandler(runtime as never)({
      ownerActorId: "hermes",
      source: "hermes",
      projectId: "memo-hub",
      purpose: "primary",
    });
    const list = await createChannelListHandler(runtime as never)({});
    const status = await createChannelStatusHandler(runtime as never)({ channelId: "hermes:primary:memo-hub" });
    const used = await createChannelUseHandler(runtime as never)({ channelId: "hermes:primary:memo-hub" });
    const closed = await createChannelCloseHandler(runtime as never)({ channelId: "hermes:primary:memo-hub" });

    expect(open.success).toBe(true);
    expect(list.success).toBe(true);
    expect(list.entries).toHaveLength(1);
    expect(status.success).toBe(true);
    expect(used.success).toBe(true);
    expect(closed.entry.status).toBe("closed");
  });
});
