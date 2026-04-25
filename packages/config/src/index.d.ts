import { MemoHubConfig } from './schema.js';
export * from './schema.js';
export * from './utils.js';
export * from './resolver.js';
export interface EnhancedConfig extends MemoHubConfig {
    _sources?: string[];
}
export declare class ConfigLoader {
    private config;
    private configPath;
    constructor(customPath?: string);
    private mergeStrategy;
    load(): EnhancedConfig;
    private scanDir;
    getConfig(): EnhancedConfig;
    getMaskedConfig(): Record<string, any>;
    save(): void;
    static initDefault(targetPath?: string): void;
}
//# sourceMappingURL=index.d.ts.map