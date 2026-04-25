import type { Text2MemInstruction, Text2MemResult, IKernel, ITrackProvider } from '@memohub/protocol';
/**
 * 知识沉淀轨道 (Insight Track)
 * 职责: 存储 LLM 提纯后的事实、决策定论和用户偏好。
 */
export declare class InsightTrack implements ITrackProvider {
    id: string;
    name: string;
    private kernel;
    /**
     * 初始化轨道，注入内核引用
     */
    initialize(kernel: IKernel): Promise<void>;
    /**
     * 执行 Text2Mem 指令
     */
    execute(instruction: Text2MemInstruction): Promise<Text2MemResult>;
    /**
     * 添加新知识
     */
    private handleAdd;
    /**
     * 检索相关知识
     */
    private handleRetrieve;
    /**
     * 更新知识
     */
    private handleUpdate;
    /**
     * 删除知识
     */
    private handleDelete;
    /**
     * 合并多个知识条目
     */
    private handleMerge;
    /**
     * 澄清知识冲突或模糊
     */
    private handleClarify;
    /**
     * 导出轨道数据
     */
    private handleExport;
    /**
     * 蒸馏知识（提炼精华）
     */
    private handleDistill;
    /**
     * 锚定知识（关联外部实体）
     */
    private handleAnchor;
    /**
     * 对比知识差异
     */
    private handleDiff;
    /**
     * 同步外部数据
     */
    private handleSync;
    /**
     * 列出轨道统计信息
     */
    private handleList;
}
//# sourceMappingURL=index.d.ts.map