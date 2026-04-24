import { z } from 'zod.js';
import { ITool, IToolManifest, ExecutionContext } from '@memohub/core/src/index.js';
import { IHostResources } from '@memohub/core/src/index.js';
import { randomUUID } from 'node:crypto.js';

export class VectorTool implements ITool {
  public manifest: IToolManifest = {
    id: 'builtin:vector',
    type: 'builtin',
    exposed: true,
    optional: false,
    inputSchema: z.object({
      id: z.string().optional(),
      vector: z.array(z.number()),
      hash: z.string(),
      track_id: z.string(),
      entities: z.array(z.string()).optional(),
      timestamp: z.string().optional(),
      meta: z.record(z.any()).optional(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
    }),
  };

  public async execute(input: any, resources: IHostResources, context: ExecutionContext): Promise<{ success: boolean }> {
    const data = {
      id: input.id || randomUUID(),
      vector: input.vector,
      hash: input.hash,
      track_id: input.track_id || 'default',
      entities: input.entities || [],
      timestamp: input.timestamp || new Date().toISOString(),
      ...input.meta,
    };
    await resources.soul.add(data);
    return { success: true };
  }
}
