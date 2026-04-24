import type { MemoryConfig } from "../types/index.js";
export declare class ConfigManager {
    private config;
    private configPath;
    constructor(configPath?: string);
    /**
     * 加载配置文件
     */
    private loadConfig;
    private normalizeConfig;
    /**
     * 获取默认配置
     */
    private getDefaultConfig;
    /**
     * 获取配置
     */
    getConfig(): MemoryConfig;
    /**
     * 获取嵌入模型配置
     */
    getEmbeddingConfig(): import("../types/index.js").EmbeddingConfig;
    /**
     * 获取 GBrain 配置
     */
    getGBrainConfig(): import("../types/index.js").GBrainConfig;
    /**
     * 获取 ClawMem 配置
     */
    getClawMemConfig(): import("../types/index.js").ClawMemConfig;
    /**
     * 获取搜索配置
     */
    getSearchConfig(): import("../types/index.js").SearchConfig;
    /**
     * 从环境变量覆盖配置
     */
    applyEnvOverrides(): void;
    /**
     * 保存配置到文件
     */
    saveConfig(): void;
    /**
     * 验证配置
     */
    validateConfig(): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=config.d.ts.map