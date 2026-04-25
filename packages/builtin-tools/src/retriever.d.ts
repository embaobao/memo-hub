import { ITool, IToolManifest, ExecutionContext } from '@memohub/core/src/index';
import { IHostResources } from '@memohub/core/src/index';
export declare class RetrieverTool implements ITool {
    manifest: IToolManifest;
    execute(input: {
        vector: number[];
        track_id?: string;
        limit: number;
        filter?: string;
    }, resources: IHostResources, context: ExecutionContext): Promise<{
        results: any[];
    }>;
}
//# sourceMappingURL=retriever.d.ts.map