import { z } from 'zod';
import { ITool, ExecutionContext } from '@memohub/core/src/index';
import { IHostResources } from '@memohub/core/src/index';
/**
 * 代码解析原子工具 (AST Code Analyzer)
 * 职责: 基于 Tree-sitter 提取代码符号、结构和实体。
 */
export declare class CodeAnalyzerTool implements ITool {
    manifest: {
        id: string;
        type: "builtin";
        description: string;
        exposed: boolean;
        optional: boolean;
        inputSchema: z.ZodObject<{
            code: z.ZodString;
            language: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            code: string;
            language: string;
        }, {
            code: string;
            language?: string | undefined;
        }>;
        outputSchema: z.ZodObject<{
            entities: z.ZodArray<z.ZodString, "many">;
            symbols: z.ZodArray<z.ZodAny, "many">;
        }, "strip", z.ZodTypeAny, {
            entities: string[];
            symbols: any[];
        }, {
            entities: string[];
            symbols: any[];
        }>;
    };
    private parser;
    private isReady;
    execute(input: any, resources: IHostResources, context: ExecutionContext): Promise<any>;
    private regexExtract;
}
//# sourceMappingURL=code-analyzer.d.ts.map