import { z } from 'zod';
import { ITool, IToolManifest, ExecutionContext } from '@memohub/core';
import { IHostResources } from '@memohub/core';
import pkg from 'lodash';
const { uniqBy, sortBy } = pkg;

export class AggregatorTool implements ITool {
   // @ts-ignore
    public manifest: IToolManifest = {
    id: 'builtin:aggregator',
    type: 'builtin',
    exposed: true,
    optional: false,
    inputSchema: z.object({
      lists: z.array(z.array(z.any())),
      sort_by: z.enum(['timestamp', 'score']).default('score'),
    }),
    outputSchema: z.object({
      results: z.array(z.any()),
    }),
  };

  public async execute(input: { lists: any[][], sort_by: string }, resources: IHostResources, context: ExecutionContext): Promise<{ results: any[] }> {
    const all = input.lists.flat();
    const unique = uniqBy(all, (r: any) => r.id || r.hash);
    
    let sorted = unique;
    if (input.sort_by === 'timestamp') {
      sorted = sortBy(unique, (r: any) => r.timestamp).reverse();
    } else if (input.sort_by === 'score') {
      sorted = sortBy(unique, (r: any) => r._distance || 0);
    }
    
    return { results: sorted };
  }
}
