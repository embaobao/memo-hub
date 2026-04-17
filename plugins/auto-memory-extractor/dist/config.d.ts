import { z } from 'zod';
/**
 * Memory extractor configuration
 */
export declare const ExtractorConfigSchema: z.ZodObject<{
    /** Path to memory-system CLI */
    cliPath: z.ZodDefault<z.ZodString>;
    /** Minimum importance threshold for extraction (0-1) */
    importanceThreshold: z.ZodDefault<z.ZodNumber>;
    /** Duplicate detection threshold (0-1) */
    duplicateThreshold: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    cliPath: string;
    importanceThreshold: number;
    duplicateThreshold: number;
}, {
    cliPath?: string | undefined;
    importanceThreshold?: number | undefined;
    duplicateThreshold?: number | undefined;
}>;
export type ExtractorConfig = z.infer<typeof ExtractorConfigSchema>;
/**
 * Load configuration from file
 */
export declare function loadExtractorConfig(path: string): Promise<ExtractorConfig>;
/**
 * Save configuration to file
 */
export declare function saveExtractorConfig(path: string, config: ExtractorConfig): Promise<void>;
//# sourceMappingURL=config.d.ts.map