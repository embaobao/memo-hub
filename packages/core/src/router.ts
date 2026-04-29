import { Text2MemInstruction } from "@memohub/protocol";
import { MemoHubConfig, RoutingRuleSchema } from "@memohub/config";
import { EventKind } from "@memohub/protocol";

/**
 * 记忆分发路由器 (Memory Router)
 * 职责: 根据指令内容、上下文或配置规则，自动选择目标轨道。
 */
export class MemoryRouter {
  private config: MemoHubConfig;

  constructor(config: MemoHubConfig) {
    this.config = config;
  }

  /**
   * 路由决策逻辑
   * @param instruction 原始指令
   * @returns 匹配到的 trackId
   */
  public route(instruction: Text2MemInstruction): string {
    // 1. 如果配置关闭了路由，或者指令已经明确指定了 trackId 且不是默认值
    if (!this.config.routing?.enabled) {
       return instruction.trackId || this.config.routing?.defaultTrack || "track-insight";
    }

    // 2. 检查规则匹配
    const rules = this.config.routing?.rules || [];
    for (const rule of rules) {
      if (this.matchRule(rule, instruction)) {
        return rule.trackId;
      }
    }

    // 3. 后验逻辑：如果是 ADD 操作且包含 file_path 字段，尝试根据后缀自动映射
    if (instruction.payload?.file_path) {
       const filePath = String(instruction.payload.file_path);
       if (filePath.endsWith('.ts') || filePath.endsWith('.js') || filePath.endsWith('.py')) {
         return "track-source";
       }
    }

    // 4. 返回默认轨道
    return instruction.trackId || this.config.routing?.defaultTrack || "track-insight";
  }

  /**
   * 规则匹配器
   */
  private matchRule(rule: any, inst: Text2MemInstruction): boolean {
    switch (rule.type) {
      case "file_suffix":
        if (!rule.suffixes || !inst.payload?.file_path) return false;
        return rule.suffixes.some((s: string) =>
          String(inst.payload.file_path).toLowerCase().endsWith(s.toLowerCase())
        );

      case "content_keyword":
        if (!rule.keywords || !inst.payload?.text) return false;
        const text = String(inst.payload.text).toLowerCase();
        return rule.keywords.some((k: string) => text.includes(k.toLowerCase()));

      case "kind_match":
        if (!rule.kind || !inst.payload?.kind) return false;
        return inst.payload.kind === rule.kind;

      case "default":
        return true;

      default:
        return false;
    }
  }
}
