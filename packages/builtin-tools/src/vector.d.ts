import { ITool, IToolManifest, ExecutionContext } from '@memohub/core/src/index';
import { IHostResources } from '@memohub/core/src/index';
export declare class VectorTool implements ITool {
    manifest: IToolManifest;
    execute(input: any, resources: IHostResources, context: ExecutionContext): Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=vector.d.ts.map