export declare class CacheManager {
    private cacheDir;
    constructor(root: string);
    /**
     * Generate a cache key based on tool id and inputs.
     */
    generateKey(toolId: string, input: any, agentContext?: any): string;
    /**
     * Get cached result.
     */
    get<T>(key: string): T | null;
    /**
     * Set cached result.
     */
    set(key: string, value: any): void;
    /**
     * Clear all cache.
     */
    clear(): void;
}
//# sourceMappingURL=cache.d.ts.map