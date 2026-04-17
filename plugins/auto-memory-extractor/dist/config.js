import { z } from 'zod';
/**
 * Memory extractor configuration
 */
export const ExtractorConfigSchema = z.object({
    /** Path to memory-system CLI */
    cliPath: z.string().default('/Users/embaobao/workspace/memory-system-cli'),
    /** Minimum importance threshold for extraction (0-1) */
    importanceThreshold: z.number().min(0).max(1).default(0.5),
    /** Duplicate detection threshold (0-1) */
    duplicateThreshold: z.number().min(0).max(1).default(0.95),
});
/**
 * Load configuration from file
 */
export async function loadExtractorConfig(path) {
    try {
        const { readFileSync } = await import('fs');
        const content = readFileSync(path, 'utf-8');
        const data = JSON.parse(content);
        return ExtractorConfigSchema.parse(data);
    }
    catch (error) {
        console.warn(`Failed to load config from ${path}, using defaults`);
        return ExtractorConfigSchema.parse({});
    }
}
/**
 * Save configuration to file
 */
export async function saveExtractorConfig(path, config) {
    const { writeFileSync } = await import('fs');
    writeFileSync(path, JSON.stringify(config, null, 2));
}
//# sourceMappingURL=config.js.map