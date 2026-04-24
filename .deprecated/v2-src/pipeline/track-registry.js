/**
 * TrackRegistry：Provider 注册表
 *
 * 设计目标：
 * - 让管道只依赖“按 track 获取 provider”的能力，而不是强耦合具体实现
 * - 方便未来以插件形式动态加载更多轨道（wiki 等）
 */
export class TrackRegistry {
    providers = new Map();
    constructor(trackProviders) {
        for (const provider of trackProviders) {
            this.providers.set(provider.track, provider);
        }
    }
    listTracks() {
        return Array.from(this.providers.keys());
    }
    get(track) {
        const provider = this.providers.get(track);
        if (!provider) {
            throw new Error(`[MemoHub] 未找到轨道 Provider: ${track}`);
        }
        return provider;
    }
    /**
     * 初始化所有 Provider（如果实现了 initialize）
     */
    async initializeAll() {
        const inits = Array.from(this.providers.values()).map(async (provider) => {
            if (provider.initialize) {
                await provider.initialize();
            }
        });
        await Promise.all(inits);
    }
}
//# sourceMappingURL=track-registry.js.map