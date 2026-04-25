import { z } from 'zod';
import pkg from 'lodash';
const { uniqBy, sortBy } = pkg;
export class AggregatorTool {
    manifest = {
        id: 'builtin:aggregator',
        type: 'builtin',
        exposed: true,
        optional: false,
        inputSchema: z.object({
            lists: z.array(z.array(z.any())),
            sort_by: z.enum(['score', 'timestamp']).default('score'),
        }),
        outputSchema: z.object({
            results: z.array(z.any()),
        }),
    };
    async execute(input, resources, context) {
        const combined = input.lists.flat();
        const unique = uniqBy(combined, (r) => r.hash || r.id);
        let sorted = unique;
        if (input.sort_by === 'timestamp') {
            sorted = sortBy(unique, (r) => r.timestamp).reverse();
        }
        else if (input.sort_by === 'score') {
            // LanceDB returns _distance, so lower distance is better
            sorted = sortBy(unique, (r) => r._distance || 0);
        }
        return { results: sorted };
    }
}
//# sourceMappingURL=aggregator.js.map