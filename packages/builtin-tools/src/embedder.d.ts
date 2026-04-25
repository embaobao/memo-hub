import { ITool, IToolManifest, ExecutionContext } from '@memohub/core/src/index';
import { IHostResources } from '@memohub/core/src/index';
export declare class EmbedderTool implements ITool {
    manifest: IToolManifest;
    execute(input: {
        text: string;
        agent?: string;
    }, resources: IHostResources, context: ExecutionContext): Promise<{
        vector: number[];
    }>;
}
//# sourceMappingURL=embedder.d.ts.map