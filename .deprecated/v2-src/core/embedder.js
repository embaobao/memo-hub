// 嵌入向量生成器
export class Embedder {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * 生成文本的嵌入向量
     */
    async embed(text) {
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
            const data = json;
            return data.data[0].embedding;
        }
        catch (error) {
            // 友好的错误提示
            if (error instanceof Error && 'code' in error) {
                const code = error.code;
                if (code === 'ECONNREFUSED') {
                    console.error(`[Embedder] ❌ 无法连接到嵌入模型服务`);
                    console.error(`  请检查：`);
                    console.error(`  1. Ollama 服务是否运行 (默认端口: ${this.config.url})`);
                    console.error(`  2. 模型 ${this.config.model} 是否已安装`);
                    console.error(`  3. 运行 'ollama list' 查看已安装的模型`);
                }
                else if (code === 'ETIMEDOUT') {
                    console.error(`[Embedder] ⏱️ 连接嵌入模型服务超时`);
                    console.error(`  请检查服务是否正常响应`);
                }
                else {
                    console.error(`[Embedder] ⚠️  嵌入模型请求失败: ${code}`);
                }
            }
            else if (error instanceof TypeError && error.message.includes('fetch failed')) {
                console.error(`[Embedder] ❌ 嵌入模型服务连接失败`);
                console.error(`  请检查 Ollama 是否正在运行: ${this.config.url}`);
            }
            else {
                console.error(`[Embedder] ⚠️  生成嵌入向量时出错: ${error instanceof Error ? error.message : String(error)}`);
            }
            // 返回零向量作为 fallback（避免阻塞主流程）
            return new Array(this.config.dimensions).fill(0);
        }
    }
    /**
     * 批量生成嵌入向量
     */
    async embedBatch(texts) {
        const results = await Promise.all(texts.map(text => this.embed(text)));
        return results;
    }
    /**
     * 计算余弦相似度
     */
    cosineSimilarity(vec1, vec2) {
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
//# sourceMappingURL=embedder.js.map