import { z } from 'zod';
/**
 * 语义去重原子工具
 */
export class DeduplicatorTool {
    manifest = {
        id: 'builtin:deduplicator',
        type: 'builtin',
        description: '扫描轨道记录并识别语义相似的冲突项',
        exposed: true,
        optional: false,
        inputSchema: z.object({
            track_id: z.string(),
            threshold: z.number().default(0.95),
        }),
        outputSchema: z.object({
            conflicts: z.array(z.any()),
        }),
    };
    async execute(input, resources, context) {
        const records = await resources.soul.list(`track_id = '${input.track_id}'`);
        const conflicts = [];
        for (let i = 0; i < records.length; i++) {
            for (let j = i + 1; j < records.length; j++) {
                const a = records[i];
                const b = records[j];
                const sim = this.cosineSimilarity(a.vector, b.vector);
                if (sim >= input.threshold) {
                    conflicts.push({ a_id: a.id, b_id: b.id, similarity: sim });
                }
            }
        }
        return { conflicts };
    }
    cosineSimilarity(a, b) {
        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
//# sourceMappingURL=tools.js.map