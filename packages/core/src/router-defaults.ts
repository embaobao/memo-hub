/**
 * MemoryRouter 默认配置
 *
 * 定义基于 kind 的路由规则
 */

import { EventKind } from "@memohub/protocol";

/**
 * 默认的内部路由规则。
 *
 * @internal
 */
export const DEFAULT_ROUTING_RULES = [
  // Memory 事件路由到默认知识处理目标。
  {
    type: "kind_match",
    kind: EventKind.MEMORY,
    trackId: "track-insight"
  },

  // 文件后缀规则用于代码处理目标。
  {
    type: "file_suffix",
    suffixes: [".ts", ".js", ".py", ".java", ".go", ".rs"],
    trackId: "track-source"
  },

  // 默认规则
  {
    type: "default",
    trackId: "track-insight"
  }
];

/**
 * MemoryRouter 默认配置。
 *
 * @internal
 */
export const DEFAULT_ROUTING_CONFIG = {
  enabled: true,
  defaultTrack: "track-insight",
  rules: DEFAULT_ROUTING_RULES
};
