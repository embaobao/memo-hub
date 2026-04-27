import { z } from 'zod';
import { ITool, IToolManifest, ExecutionContext } from '@memohub/core/src/index';
import { IHostResources } from '@memohub/core/src/index';

export class RetrieverTool implements ITool {
  public manifest: IToolManifest = {
    id: 'builtin:retriever',
    type: 'builtin',
    exposed: true,
    optional: false,
    inputSchema: z.object({
      vector: z.array(z.number()),
      track_id: z.string().optional(),
      limit: z.number().int().positive().default(5),
      filter: z.string().optional(),
      hydrate: z.boolean().default(true),
    }),
    outputSchema: z.object({
      results: z.array(z.any()),
    }),
  };

  public async execute(input: { vector: number[], track_id?: string, limit: number, filter?: string, hydrate?: boolean }, resources: IHostResources, context: ExecutionContext): Promise<{ results: any[] }> {
    const filter = input.track_id ? `track_id = '${input.track_id}'` : input.filter;
    const searchResults = await resources.soul.search(input.vector, {
      limit: input.limit,
      filter: filter,
    });

    const results = [];
    if (input.hydrate !== false) {
      for (const rawItem of searchResults) {
        const item = { ...rawItem };
        if (item.hash) {
          try {
            item.text = await resources.flesh.read(item.hash);
          } catch {
            item.text = '[Content Missing]';
          }
        }
        results.push(item);
      }
    } else {
      results.push(...searchResults);
    }

    return { results };
  }
}
