import { ITool, IToolManifest, ExecutionContext } from '@memohub/core/src/index';
import { IHostResources } from '@memohub/core/src/index';
export declare class AggregatorTool implements ITool {
    manifest: IToolManifest;
    execute(input: {
        lists: any[][];
        sort_by: string;
    }, resources: IHostResources, context: ExecutionContext): Promise<{
        results: any[];
    }>;
}
//# sourceMappingURL=aggregator.d.ts.map