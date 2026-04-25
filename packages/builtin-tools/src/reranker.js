import { z } from 'zod';
export class RerankerTool {
    manifest = {
        id: 'builtin:reranker',
        type: 'builtin',
        exposed: true,
        optional: true,
        inputSchema: z.object({
            query: z.string(),
            results: z.array(z.any()),
            agent: z.string().default('ranker'),
            top_n: z.number().int().positive().default(3),
        }),
        outputSchema: z.object({
            results: z.array(z.any()),
        }),
    };
    async execute(input, resources, context) {
        if (input.results.length === 0)
            return { results: [] };
        // In a real CROSS-ENCODER implementation, we would call a specific model.
        // For now, we simulate or use a simpler logic.
        // Logic: LLM is asked to pick the best results.
        const completer = resources.ai.getCompleter(input.agent);
        const contextStr = input.results.map((r, i) => `ID: ${i}\nContent: ${r.text || JSON.stringify(r)}`).join('\n---\n');
        const prompt = `Given the query: "${input.query}", re-rank the following results from most relevant to least relevant. Return ONLY a comma-separated list of IDs (e.g., 2,0,1).
    
Results:
${contextStr}`;
        try {
            const response = await completer.chat([
                { role: 'system', content: 'You are an expert at information retrieval and re-ranking.' },
                { role: 'user', content: prompt }
            ]);
            const ids = response.split(',').map((s) => parseInt(s.trim())).filter((n) => !isNaN(n));
            const reranked = ids.map((id) => input.results[id]).filter(Boolean);
            return { results: reranked.slice(0, input.top_n) };
        }
        catch (error) {
            console.warn('Reranking failed, returning original results:', error);
            return { results: input.results.slice(0, input.top_n) };
        }
    }
}
//# sourceMappingURL=reranker.js.map