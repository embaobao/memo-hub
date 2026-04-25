import { ITool, IToolManifest, ExecutionContext } from '@memohub/core/src/index';
import { IHostResources } from '@memohub/core/src/index';
export declare class CasTool implements ITool {
    manifest: IToolManifest;
    execute(input: {
        content: string;
    }, resources: IHostResources, context: ExecutionContext): Promise<{
        hash: string;
        path: string;
    }>;
}
//# sourceMappingURL=cas.d.ts.map