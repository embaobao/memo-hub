import { z } from 'zod';
export class EmbedderTool {
    manifest = {
        id: 'builtin:embedder',
        type: 'builtin',
        exposed: true,
        optional: false,
        inputSchema: z.object({
            text: z.string().min(1),
            agent: z.string().default('embedder'),
        }),
        outputSchema: z.object({
            vector: z.array(z.number()),
        }),
    };
    async execute(input, resources, context) {
        const agentId = input.agent || 'embedder';
        const embedder = resources.ai.getEmbedder(agentId);
        const vector = await embedder.embed(input.text);
        return { vector };
    }
}
//# sourceMappingURL=embedder.js.map