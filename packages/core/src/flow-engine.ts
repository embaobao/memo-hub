import pkg from 'lodash';
const { get } = pkg;
import { FlowStepConfig, VariableResolver } from '@memohub/config';
import { ToolRegistry, ExecutionContext } from './tool-registry.js';
import { ObservationKernel } from './observation.js';
import { AIHub } from './ai-hub.js';
import { CacheManager } from './cache.js';
import { IHostResources } from './types-host.js';

export class FlowEngine {
  private resolver = new VariableResolver();

  constructor(
    private toolRegistry: ToolRegistry,
    private observation: ObservationKernel,
    private aiHub: AIHub,
    private cache: CacheManager,
    private resources: IHostResources
  ) {}

  /**
   * Execute a flow defined in the configuration.
   */
  public async executeFlow(
    flow: FlowStepConfig[],
    initialPayload: any,
    traceId?: string
  ): Promise<any> {
    const tid = traceId || this.observation.createTraceId();
    // n8n/Dify style state: payload and nodes results
    const state: Record<string, any> = { payload: initialPayload, nodes: {} };
    let lastResult: any = null;

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
      let output: any;
      try {
        if (step.tool.includes(':') && !step.tool.startsWith('builtin:')) {
          // 嵌套流调用: track-id:OPERATION
          const [targetTrackId, op] = step.tool.split(':');
          const result = await this.resources.kernel.dispatch({
            op: op as any,
            trackId: targetTrackId,
            payload: input
          });
          output = result.data;
        } else {
          // 原子原子工具节点调用
          const tool = this.toolRegistry.get(step.tool);
          const execContext: ExecutionContext = { traceId: tid, spanId, state };
          output = await this.observation.safeRun(
            () => tool.execute(input, this.resources, execContext),
            { traceId: tid, spanId, step: step.step, tool: step.tool, input }
          );
        }
        
        if (!cacheDisabled) {
          this.cache.set(cacheKey, output);
        }

        state.nodes[step.step] = output;
        lastResult = output;
      } catch (error: any) {
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

  private resolveInput(inputDef: any, pool: any): any {
    if (!inputDef) return pool.payload;
    if (typeof inputDef === 'string' && inputDef.startsWith('$.')) {
      return get(pool, inputDef.slice(2));
    }
    if (typeof inputDef === 'object') {
      const resolved: any = {};
      for (const [key, value] of Object.entries(inputDef)) {
        if (typeof value === 'string' && value.startsWith('$.')) {
          resolved[key] = get(pool, value.slice(2));
        } else {
          resolved[key] = value;
        }
      }
      return resolved;
    }
    return inputDef;
  }
}
