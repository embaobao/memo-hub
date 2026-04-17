import { z } from 'zod';
/**
 * Memory injector configuration
 */
export declare const InjectorConfigSchema: z.ZodObject<{
    /** Path to memory-system CLI */
    cliPath: z.ZodDefault<z.ZodString>;
    /** Maximum results per search */
    maxResults: z.ZodDefault<z.ZodNumber>;
    /** Maximum total memories to inject */
    maxTotalMemories: z.ZodDefault<z.ZodNumber>;
    /** Maximum GBrain memories to inject */
    maxGBrainMemories: z.ZodDefault<z.ZodNumber>;
    /** Maximum ClawMem memories to inject */
    maxClawMemMemories: z.ZodDefault<z.ZodNumber>;
    /** Minimum relevance threshold (0-1) */
    minRelevance: z.ZodDefault<z.ZodNumber>;
    /** Injection strategy: semantic, keyword, or hybrid */
    strategy: z.ZodDefault<z.ZodEnum<["semantic", "keyword", "hybrid"]>>;
}, "strip", z.ZodTypeAny, {
    cliPath: string;
    maxResults: number;
    maxTotalMemories: number;
    maxGBrainMemories: number;
    maxClawMemMemories: number;
    minRelevance: number;
    strategy: "semantic" | "keyword" | "hybrid";
}, {
    cliPath?: string | undefined;
    maxResults?: number | undefined;
    maxTotalMemories?: number | undefined;
    maxGBrainMemories?: number | undefined;
    maxClawMemMemories?: number | undefined;
    minRelevance?: number | undefined;
    strategy?: "semantic" | "keyword" | "hybrid" | undefined;
}>;
export type InjectorConfig = z.infer<typeof InjectorConfigSchema>;
/**
 * Load configuration from file
 */
export declare function loadInjectorConfig(path: string): Promise<InjectorConfig>;
/**
 * Save configuration to file
 */
export declare function saveInjectorConfig(path: string, config: InjectorConfig): Promise<void>;
//# sourceMappingURL=config.d.ts.map