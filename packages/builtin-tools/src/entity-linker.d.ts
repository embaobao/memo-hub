import { ITool, IToolManifest, ExecutionContext } from '@memohub/core/src/index';
import { IHostResources } from '@memohub/core/src/index';
export declare class EntityLinkerTool implements ITool {
    manifest: IToolManifest;
    execute(input: {
        text: string;
    }, resources: IHostResources, context: ExecutionContext): Promise<{
        entities: any[];
    }>;
}
//# sourceMappingURL=entity-linker.d.ts.map