import { describe, test, expect } from "bun:test";
import { MemoryRouter } from "../dist/router.js";
import { DEFAULT_ROUTING_CONFIG } from "../dist/router-defaults.js";
import { MemoOp } from "@memohub/protocol";
import { EventKind } from "@memohub/protocol";

describe("MemoryRouter Extension - Kind Match", () => {
  test("应该根据 kind 字段路由", () => {
    const config = {
      routing: {
        enabled: true,
        defaultTrack: "track-insight",
        rules: [
          {
            type: "kind_match",
            kind: EventKind.MEMORY,
            trackId: "track-insight"
          }
        ]
      }
    };

    const router = new MemoryRouter(config);

    const instruction = {
      op: MemoOp.ADD,
      // 注意：不设置 trackId
      payload: {
        text: "Test memory",
        kind: EventKind.MEMORY
      }
    };

    const trackId = router.route(instruction);
    expect(trackId).toBe("track-insight");
  });

  test("kind_match 规则应该优先于默认规则", () => {
    const config = {
      routing: {
        enabled: true,
        defaultTrack: "track-wiki",
        rules: [
          {
            type: "kind_match",
            kind: EventKind.MEMORY,
            trackId: "track-insight"
          }
        ]
      }
    };

    const router = new MemoryRouter(config);

    const instruction = {
      op: MemoOp.ADD,
      payload: {
        text: "Test",
        kind: EventKind.MEMORY
      }
    };

    const trackId = router.route(instruction);
    expect(trackId).toBe("track-insight");
  });

  test("应该支持显式 trackId 覆盖", () => {
    const config = {
      routing: {
        enabled: true,
        defaultTrack: "track-insight",
        rules: [
          {
            type: "kind_match",
            kind: EventKind.MEMORY,
            trackId: "track-wiki"  // 这个规则应该被忽略
          }
        ]
      }
    };

    const router = new MemoryRouter(config);

    const instruction = {
      op: MemoOp.ADD,
      trackId: "track-source",  // 显式指定 trackId
      payload: {
        text: "Test",
        kind: EventKind.MEMORY
      }
    };

    const trackId = router.route(instruction);
    expect(trackId).toBe("track-source");
  });

  test("应该向后兼容现有规则", () => {
    const config = {
      routing: {
        enabled: true,
        defaultTrack: "track-insight",
        rules: [
          {
            type: "file_suffix",
            suffixes: [".ts", ".js"],
            trackId: "track-source"
          }
        ]
      }
    };

    const router = new MemoryRouter(config);

    const instruction = {
      op: MemoOp.ADD,
      payload: {
        file_path: "test.ts",
        text: "code"
      }
    };

    const trackId = router.route(instruction);
    expect(trackId).toBe("track-source");
  });

  test("默认配置应该正确路由 memory 事件", () => {
    const config = {
      routing: DEFAULT_ROUTING_CONFIG
    };

    const router = new MemoryRouter(config);

    const instruction = {
      op: MemoOp.ADD,
      payload: {
        text: "Test memory",
        kind: EventKind.MEMORY
      }
    };

    const trackId = router.route(instruction);
    expect(trackId).toBe("track-insight");
  });

  test("没有 kind 字段时应该使用其他规则", () => {
    const config = {
      routing: {
        enabled: true,
        defaultTrack: "track-insight",
        rules: [
          {
            type: "kind_match",
            kind: EventKind.MEMORY,
            trackId: "track-insight"
          },
          {
            type: "file_suffix",
            suffixes: [".ts"],
            trackId: "track-source"
          },
          {
            type: "default",
            trackId: "track-wiki"
          }
        ]
      }
    };

    const router = new MemoryRouter(config);

    // 没有 kind 字段，但有 file_path
    const instruction = {
      op: MemoOp.ADD,
      payload: {
        file_path: "test.ts",
        text: "code"
        // 注意：没有 kind 字段
      }
    };

    const trackId = router.route(instruction);
    expect(trackId).toBe("track-source");
  });

  test("所有规则都不匹配时应该使用默认 track", () => {
    const config = {
      routing: {
        enabled: true,
        defaultTrack: "track-custom",
        rules: [
          {
            type: "kind_match",
            kind: EventKind.MEMORY,
            trackId: "track-insight"
          }
        ]
      }
    };

    const router = new MemoryRouter(config);

    // 不匹配任何规则
    const instruction = {
      op: MemoOp.ADD,
      payload: {
        text: "Test"
        // 没有 kind，没有 file_path
      }
    };

    const trackId = router.route(instruction);
    expect(trackId).toBe("track-custom");
  });
});
