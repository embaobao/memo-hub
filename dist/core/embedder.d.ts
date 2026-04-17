import type { EmbeddingConfig } from "../types/index.js";
export declare class Embedder {
    private config;
    constructor(config: EmbeddingConfig);
    /**
     * 生成文本的嵌入向量
     */
    embed(text: string): Promise<number[]>;
    /**
     * 批量生成嵌入向量
     */
    embedBatch(texts: string[]): Promise<number[][]>;
    /**
     * 计算余弦相似度
     */
    cosineSimilarity(vec1: number[], vec2: number[]): number;
}
//# sourceMappingURL=embedder.d.ts.map