import { z } from 'zod';
import { readFileSync, writeFileSync } from 'fs';
/**
 * Memory injector configuration
 */
export const InjectorConfigSchema = z.object({
    /** Path to memory-system CLI */
    cliPath: z.string().default('/Users/embaobao/workspace/memory-system-cli'),
    /** Maximum results per search */
    maxResults: z.number().min(1).max(50).default(10),
    /** Maximum total memories to inject */
    maxTotalMemories: z.number().min(1).max(20).default(10),
    /** Maximum GBrain memories to inject */
    maxGBrainMemories: z.number().min(1).max(10).default(5),
    /** Maximum ClawMem memories to inject */
    maxClawMemMemories: z.number().min(1).max(10).default(5),
    /** Minimum relevance threshold (0-1) */
    minRelevance: z.number().min(0).max(1).default(0.6),
    /** Injection strategy: semantic, keyword, or hybrid */
    strategy: z.enum(['semantic', 'keyword', 'hybrid']).default('hybrid'),
});
/**
 * Load configuration from file
 */
export async function loadInjectorConfig(path) {
    try {
        const content = readFileSync(path, 'utf-8');
        const data = JSON.parse(content);
        return InjectorConfigSchema.parse(data);
    }
    catch (error) {
        console.warn(`Failed to load config from ${path}, using defaults`);
        return InjectorConfigSchema.parse({});
    }
}
/**
 * Save configuration to file
 */
export async function saveInjectorConfig(path, config) {
    writeFileSync(path, JSON.stringify(config, null, 2));
}
//# sourceMappingURL=config.js.map