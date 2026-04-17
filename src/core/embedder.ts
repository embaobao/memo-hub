// 嵌入向量生成器

import type { EmbeddingConfig } from "../types/index.js";

export class Embedder {
  private config: EmbeddingConfig;

  constructor(config: EmbeddingConfig) {
    this.config = config;
  }

  /**
   * 生成文本的嵌入向量
   */
  async embed(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.config.url}/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.model,
          input: text,
        }),
        signal: AbortSignal.timeout(this.config.timeout * 1000),
      });

      if (!response.ok) {
        throw new Error(`Embedding API error: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      const data = json as any;
      return data.data[0].embedding as number[];
    } catch (error) {
      console.error(`[Embedder] Error generating embedding:`, error);
      // 返回零向量作为 fallback
      return new Array(this.config.dimensions).fill(0);
    }
  }

  /**
   * 批量生成嵌入向量
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    const results = await Promise.all(
      texts.map(text => this.embed(text))
    );
    return results;
  }

  /**
   * 计算余弦相似度
   */
  cosineSimilarity(vec1: number[], vec2: number[]): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
}
