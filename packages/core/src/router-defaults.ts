/**
 * MemoryRouter 默认配置
 *
 * 定义基于 kind 的路由规则
 */

import { EventKind } from "@memohub/protocol";

/**
 * 默认的路由规则
 *
 * 优先级从高到低：
 * 1. kind_match - 基于事件类型
 * 2. file_suffix - 基于文件后缀
 * 3. content_keyword - 基于内容关键词
 * 4. default - 默认规则
 */
export const DEFAULT_ROUTING_RULES = [
  // Memory 事件路由到 track-insight
  {
    type: "kind_match",
    kind: EventKind.MEMORY,
    trackId: "track-insight"
  },

  // 文件后缀规则（向后兼容）
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
 * MemoryRouter 默认配置
 */
export const DEFAULT_ROUTING_CONFIG = {
  enabled: true,
  defaultTrack: "track-insight",
  rules: DEFAULT_ROUTING_RULES
};
