import { PipelineEventBus } from "./event-bus.js";
/**
 * BasePipe：可插拔阶段执行器
 *
 * 说明：
 * - 管道由多个 PipelineStage 串联组成，每个阶段都被事件流观测
 * - 这里不关心任何具体业务（GBrain/ClawMem/CAS/路由规则等），只负责阶段编排与事件产出
 */
export class BasePipe {
    name;
    events;
    stages = [];
    constructor(options) {
        const { name, eventBus } = options;
        this.name = name;
        this.events = eventBus ?? new PipelineEventBus();
    }
    use(stage) {
        this.stages.push(stage);
        return this;
    }
    /**
     * 执行管道
     *
     * 约定：
     * - 输入与输出在类型层面由管道泛型约束
     * - 运行时使用 unknown 做中间变量，避免阶段链条在 TS 层面被强绑定（便于渐进式演进）
     */
    async run(input, context) {
        const timestamp = new Date().toISOString();
        this.events.emit({
            name: "pipe_start",
            pipe: this.name,
            timestamp,
            context,
            input,
        });
        try {
            let current = input;
            for (const stage of this.stages) {
                const stageTimestamp = new Date().toISOString();
                this.events.emit({
                    name: "stage_start",
                    pipe: this.name,
                    stage: stage.name,
                    timestamp: stageTimestamp,
                    context,
                    input: current,
                });
                try {
                    current = await stage.run(current, context);
                    this.events.emit({
                        name: "stage_success",
                        pipe: this.name,
                        stage: stage.name,
                        timestamp: new Date().toISOString(),
                        context,
                        output: current,
                    });
                }
                catch (error) {
                    this.events.emit({
                        name: "stage_error",
                        pipe: this.name,
                        stage: stage.name,
                        timestamp: new Date().toISOString(),
                        context,
                        error,
                    });
                    throw error;
                }
            }
            this.events.emit({
                name: "pipe_success",
                pipe: this.name,
                timestamp: new Date().toISOString(),
                context,
                output: current,
            });
            return current;
        }
        catch (error) {
            this.events.emit({
                name: "pipe_error",
                pipe: this.name,
                timestamp: new Date().toISOString(),
                context,
                error,
            });
            throw error;
        }
    }
}
//# sourceMappingURL=base-pipe.js.map