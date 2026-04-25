import { ITool, IToolManifest, ExecutionContext } from '@memohub/core/src/index';
import { IHostResources } from '@memohub/core/src/index';
export declare class RerankerTool implements ITool {
    manifest: IToolManifest;
    execute(input: {
        query: string;
        results: any[];
        agent: string;
        top_n: number;
    }, resources: IHostResources, context: ExecutionContext): Promise<{
        results: any[];
    }>;
}
//# sourceMappingURL=reranker.d.ts.map