import { FlowStepConfig } from '@memohub/config';
import { ToolRegistry } from './tool-registry.js';
import { ObservationKernel } from './observation.js';
import { AIHub } from './ai-hub.js';
import { CacheManager } from './cache.js';
import { IHostResources } from './types-host.js';
export declare class FlowEngine {
    private toolRegistry;
    private observation;
    private aiHub;
    private cache;
    private resources;
    private resolver;
    constructor(toolRegistry: ToolRegistry, observation: ObservationKernel, aiHub: AIHub, cache: CacheManager, resources: IHostResources);
    /**
     * Execute a flow defined in the configuration.
     */
    executeFlow(flow: FlowStepConfig[], initialPayload: any, traceId?: string): Promise<any>;
    private resolveInput;
}
//# sourceMappingURL=flow-engine.d.ts.map