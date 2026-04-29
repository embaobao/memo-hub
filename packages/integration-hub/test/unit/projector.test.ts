import { describe, expect, test } from "bun:test";
import {
  EventConfidence,
  EventKind,
  EventSource,
} from "@memohub/protocol";
import { EventProjector } from "../../src/projector.js";

describe("EventProjector", () => {
  test("外部 metadata.trackId 不应覆盖新架构投影边界", async () => {
    const projector = new EventProjector();

    const instruction = await projector.projectEvent({
      source: EventSource.CLI,
      channel: "cli-command",
      kind: EventKind.MEMORY,
      projectId: "memo-hub",
      confidence: EventConfidence.REPORTED,
      payload: {
        text: "Track source memory",
        metadata: {
          trackId: "track-source",
        },
      },
    });

    expect(instruction.trackId).toBeUndefined();
    expect(instruction.payload.metadata.trackId).toBe("track-source");
  });

  test("file_path 和 category 应保留在投影结果中", async () => {
    const projector = new EventProjector();

    const instruction = await projector.projectEvent({
      source: EventSource.IDE,
      channel: "vscode",
      kind: EventKind.MEMORY,
      projectId: "memo-hub",
      confidence: EventConfidence.OBSERVED,
      payload: {
        text: "Code context",
        file_path: "src/index.ts",
        category: "code",
      },
    });

    expect(instruction.payload.file_path).toBe("src/index.ts");
    expect(instruction.payload.category).toBe("code");
  });
});
