import { ITool, IToolManifest, ExecutionContext } from '@memohub/core/src/index';
import { IHostResources } from '@memohub/core/src/index';
export declare class GraphStoreTool implements ITool {
    manifest: IToolManifest;
    private dbPath;
    constructor(root: string);
    execute(input: any, resources: IHostResources, context: ExecutionContext): Promise<{
        triples: any[];
    }>;
}
//# sourceMappingURL=graph-store.d.ts.map