import type { Text2MemInstruction, Text2MemResult, IKernel, ITrackProvider } from '@memohub/protocol';
/**
 * 源码资产轨道 (Source Track)
 * 职责: 处理源代码，进行 AST 解析，索引符号（函数、类、变量）及其调用关系。
 */
export declare class SourceTrack implements ITrackProvider {
    id: string;
    name: string;
    private kernel;
    private parser;
    private isParserReady;
    /**
     * 初始化轨道
     */
    initialize(kernel: IKernel): Promise<void>;
    /**
     * 执行指令映射
     */
    execute(instruction: Text2MemInstruction): Promise<Text2MemResult>;
    /**
     * 符号提取 (支持 Tree-sitter 与正则 Fallback)
     */
    private extractSymbols;
    private extractSymbolsWithTreeSitter;
    private extractSymbolsRegex;
    private inferAstType;
    private extractBlock;
    /**
     * 添加代码资产
     */
    private handleAdd;
    /**
     * 检索代码片段
     */
    private handleRetrieve;
    /**
     * 更新代码
     */
    private handleUpdate;
    /**
     * 删除代码记录
     */
    private handleDelete;
    /**
     * 合并代码记录 (在 Source 轨通常较少使用)
     */
    private handleMerge;
    /**
     * 列出符号
     */
    private handleList;
    /**
     * 澄清
     */
    private handleClarify;
    /**
     * 导出代码资产
     */
    private handleExport;
    /**
     * 蒸馏 (例如提取接口定义)
     */
    private handleDistill;
    /**
     * 锚定外部文档
     */
    private handleAnchor;
    /**
     * 代码差异对比
     */
    private handleDiff;
    /**
     * 同步工程代码
     */
    private handleSync;
}
//# sourceMappingURL=index.d.ts.map