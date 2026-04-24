import type { MemoContext, PipelineStage } from "../types/index.js";
import { PipelineEventBus } from "./event-bus.js";
export interface BasePipeOptions {
    name: string;
    eventBus?: PipelineEventBus;
}
/**
 * BasePipe：可插拔阶段执行器
 *
 * 说明：
 * - 管道由多个 PipelineStage 串联组成，每个阶段都被事件流观测
 * - 这里不关心任何具体业务（GBrain/ClawMem/CAS/路由规则等），只负责阶段编排与事件产出
 */
export declare class BasePipe<TInput, TOutput> {
    readonly name: string;
    readonly events: PipelineEventBus;
    private stages;
    constructor(options: BasePipeOptions);
    use<TStageInput, TStageOutput>(stage: PipelineStage<TStageInput, TStageOutput>): this;
    /**
     * 执行管道
     *
     * 约定：
     * - 输入与输出在类型层面由管道泛型约束
     * - 运行时使用 unknown 做中间变量，避免阶段链条在 TS 层面被强绑定（便于渐进式演进）
     */
    run(input: TInput, context?: MemoContext): Promise<TOutput>;
}
//# sourceMappingURL=base-pipe.d.ts.map