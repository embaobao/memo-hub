import { z } from 'zod';
import { ITool, IToolManifest, ExecutionContext } from '../../tool-registry.js';
import { VectorStorage } from '@memohub/storage-soul';

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
    }),
    outputSchema: z.object({
      results: z.array(z.any()),
    }),
  };

  constructor(private storage: VectorStorage) {}

  public async execute(input: { vector: number[], track_id?: string, limit: number, filter?: string }, context: ExecutionContext): Promise<{ results: any[] }> {
    const filter = input.track_id ? `track_id = '${input.track_id}'` : input.filter;
    const results = await this.storage.search(input.vector, {
      limit: input.limit,
      filter: filter,
    });
    return { results };
  }
}
