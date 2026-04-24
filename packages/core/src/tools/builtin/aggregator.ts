import { z } from 'zod';
import { ITool, IToolManifest, ExecutionContext } from '../../tool-registry.js';
import pkg from 'lodash';
const { uniqBy, sortBy } = pkg;

export class AggregatorTool implements ITool {
  public manifest: IToolManifest = {
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

  public async execute(input: { lists: any[][], sort_by: string }, context: ExecutionContext): Promise<{ results: any[] }> {
    const combined = input.lists.flat();
    const unique = uniqBy(combined, (r: any) => r.hash || r.id);
    
    let sorted = unique;
    if (input.sort_by === 'timestamp') {
      sorted = sortBy(unique, (r: any) => r.timestamp).reverse();
    } else if (input.sort_by === 'score') {
      // LanceDB returns _distance, so lower distance is better
      sorted = sortBy(unique, (r: any) => r._distance || 0);
    }
    
    return { results: sorted };
  }
}
