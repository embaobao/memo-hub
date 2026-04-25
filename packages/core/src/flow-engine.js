import pkg from 'lodash';
const { get } = pkg;
import { VariableResolver } from '@memohub/config';
export class FlowEngine {
    toolRegistry;
    observation;
    aiHub;
    cache;
    resources;
    resolver = new VariableResolver();
    constructor(toolRegistry, observation, aiHub, cache, resources) {
        this.toolRegistry = toolRegistry;
        this.observation = observation;
        this.aiHub = aiHub;
        this.cache = cache;
        this.resources = resources;
    }
    /**
     * Execute a flow defined in the configuration.
     */
    async executeFlow(flow, initialPayload, traceId) {
        const tid = traceId || this.observation.createTraceId();
        // n8n/Dify style state: payload and nodes results
        const state = { payload: initialPayload, nodes: {} };
        let lastResult = null;
        const cacheDisabled = process.env.MEMOHUB_CACHE_DISABLED === 'true';
        for (const step of flow) {
            const spanId = this.observation.createSpanId();
            const tool = this.toolRegistry.get(step.tool);
            // Resolve inputs using state machine logic
            const input = this.resolver.resolve(step.input || state.payload, state);
            const cacheKey = this.cache.generateKey(step.tool, input, step.agent);
            if (!cacheDisabled) {
                const cached = this.cache.get(cacheKey);
                if (cached) {
                    state.nodes[step.step] = cached;
                    lastResult = cached;
                    continue;
                }
            }
            // 2. 获取工具或嵌套流
            let output;
            try {
                if (step.tool.includes(':') && !step.tool.startsWith('builtin:')) {
                    // 嵌套流调用: track-id:OPERATION
                    const [targetTrackId, op] = step.tool.split(':');
                    const result = await this.resources.kernel.dispatch({
                        op: op,
                        trackId: targetTrackId,
                        payload: input
                    });
                    output = result.data;
                }
                else {
                    // 原子原子工具节点调用
                    const tool = this.toolRegistry.get(step.tool);
                    const execContext = { traceId: tid, spanId, state };
                    output = await this.observation.safeRun(() => tool.execute(input, this.resources, execContext), { traceId: tid, spanId, step: step.step, tool: step.tool, input });
                }
                if (!cacheDisabled) {
                    this.cache.set(cacheKey, output);
                }
                state.nodes[step.step] = output;
                lastResult = output;
            }
            catch (error) {
                console.error(`Step ${step.step} (${step.tool}) failed:`, error);
                if (step.on_fail === 'skip') {
                    console.warn(`Step ${step.step} failed, skipping...`);
                    continue;
                }
                // Handle retry/fallback if needed (simplified for now)
                throw error;
            }
        }
        return lastResult;
    }
    resolveInput(inputDef, pool) {
        if (!inputDef)
            return pool.payload;
        if (typeof inputDef === 'string' && inputDef.startsWith('$.')) {
            return get(pool, inputDef.slice(2));
        }
        if (typeof inputDef === 'object') {
            const resolved = {};
            for (const [key, value] of Object.entries(inputDef)) {
                if (typeof value === 'string' && value.startsWith('$.')) {
                    resolved[key] = get(pool, value.slice(2));
                }
                else {
                    resolved[key] = value;
                }
            }
            return resolved;
        }
        return inputDef;
    }
}
//# sourceMappingURL=flow-engine.js.map