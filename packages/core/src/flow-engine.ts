import pkg from 'lodash';
const { get } = pkg;
import { FlowStepConfig } from '@memohub/config';
import { ToolRegistry, ExecutionContext } from './tool-registry.js';
import { ObservationKernel } from './observation.js';
import { AIHub } from './ai-hub.js';
import { CacheManager } from './cache.js';

export class FlowEngine {
  constructor(
    private toolRegistry: ToolRegistry,
    private observation: ObservationKernel,
    private aiHub: AIHub,
    private cache: CacheManager
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
    const contextPool: Record<string, any> = { payload: initialPayload };
    let lastResult: any = null;

    const cacheDisabled = process.env.MEMOHUB_CACHE_DISABLED === 'true';

    for (const step of flow) {
      const spanId = this.observation.createSpanId();
      const tool = this.toolRegistry.get(step.tool);
      
      // Resolve inputs from context pool
      const input = this.resolveInput(step.input, contextPool);

      const cacheKey = this.cache.generateKey(step.tool, input, step.agent);
      
      if (!cacheDisabled) {
        const cached = this.cache.get(cacheKey);
        if (cached) {
          contextPool[step.step] = cached;
          lastResult = cached;
          continue;
        }
      }

      const execContext: ExecutionContext = {
        traceId: tid,
        spanId,
        contextPool,
        variables: step.input && typeof step.input === 'object' ? step.input : {}
      };

      try {
        const output = await this.observation.safeRun(
          () => tool.execute(input, execContext),
          { traceId: tid, spanId, step: step.step, tool: step.tool, input }
        );
        
        if (!cacheDisabled) {
          this.cache.set(cacheKey, output);
        }

        contextPool[step.step] = output;
        lastResult = output;
      } catch (error) {
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
