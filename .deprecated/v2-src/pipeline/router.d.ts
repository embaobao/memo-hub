import type { MemoContext, MemoIngestRequest, RoutingConfig } from "../types/index.js";
export interface RouteDecision {
    /**
     * 最终路由到的轨道（如：gbrain / clawmem）
     */
    track: string;
    /**
     * 命中规则名称（便于观测与回放）
     */
    rule: string;
    /**
     * 规则命中原因（尽量简短、可读）
     */
    reason: string;
}
export interface RoutingRule {
    /**
     * 规则名称（稳定标识，用于观测与排查）
     */
    name: string;
    /**
     * 尝试基于请求/上下文做路由决策：
     * - 返回 RouteDecision：表示命中并给出最终 track
     * - 返回 null：表示未命中，交给下一条规则继续判断（责任链）
     */
    decide: (request: MemoIngestRequest, context?: MemoContext) => RouteDecision | null;
}
export declare class RoutingEngine {
    private rules;
    constructor(rules: RoutingRule[]);
    /**
     * 执行责任链，返回最终路由结果
     *
     * 约定：
     * - 一旦某条规则返回 decision，即停止向下传递
     * - 若所有规则都不命中，则回退到 gbrain（保证兼容性，不让写入链路中断）
     */
    route(request: MemoIngestRequest, context?: MemoContext): RouteDecision;
}
/**
 * 基于配置创建路由引擎
 *
 * 优先级说明：
 * - 调用方（ConfigManager）负责把“环境变量 > YAML > 默认值”的最终配置产出
 * - 本方法仅把最终 routing 配置编译为可执行的责任链规则列表
 */
export declare function createRoutingEngine(routing?: RoutingConfig): RoutingEngine;
//# sourceMappingURL=router.d.ts.map