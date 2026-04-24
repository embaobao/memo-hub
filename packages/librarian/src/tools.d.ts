import { z } from 'zod';
import { ITool, ExecutionContext } from '@memohub/core';
import { IHostResources } from '@memohub/core';
/**
 * 语义去重原子工具
 */
export declare class DeduplicatorTool implements ITool {
    manifest: {
        id: string;
        type: "builtin";
        description: string;
        exposed: boolean;
        optional: boolean;
        inputSchema: z.ZodObject<{
            track_id: z.ZodString;
            threshold: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            track_id: string;
            threshold: number;
        }, {
            track_id: string;
            threshold?: number | undefined;
        }>;
        outputSchema: z.ZodObject<{
            conflicts: z.ZodArray<z.ZodAny, "many">;
        }, "strip", z.ZodTypeAny, {
            conflicts: any[];
        }, {
            conflicts: any[];
        }>;
    };
    execute(input: any, resources: IHostResources, context: ExecutionContext): Promise<any>;
    private cosineSimilarity;
}
//# sourceMappingURL=tools.d.ts.map