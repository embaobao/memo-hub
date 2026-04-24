import type { TrackProvider } from "../types/index.js";
/**
 * TrackRegistry：Provider 注册表
 *
 * 设计目标：
 * - 让管道只依赖“按 track 获取 provider”的能力，而不是强耦合具体实现
 * - 方便未来以插件形式动态加载更多轨道（wiki 等）
 */
export declare class TrackRegistry {
    private providers;
    constructor(trackProviders: TrackProvider[]);
    listTracks(): string[];
    get(track: string): TrackProvider;
    /**
     * 初始化所有 Provider（如果实现了 initialize）
     */
    initializeAll(): Promise<void>;
}
//# sourceMappingURL=track-registry.d.ts.map