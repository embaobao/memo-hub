import { z } from 'zod';
export class RetrieverTool {
    manifest = {
        id: 'builtin:retriever',
        type: 'builtin',
        exposed: true,
        optional: false,
        inputSchema: z.object({
            vector: z.array(z.number()),
            track_id: z.string().optional(),
            limit: z.number().int().positive().default(5),
            filter: z.string().optional(),
        }),
        outputSchema: z.object({
            results: z.array(z.any()),
        }),
    };
    async execute(input, resources, context) {
        const filter = input.track_id ? `track_id = '${input.track_id}'` : input.filter;
        const results = await resources.soul.search(input.vector, {
            limit: input.limit,
            filter: filter,
        });
        return { results };
    }
}
//# sourceMappingURL=retriever.js.map