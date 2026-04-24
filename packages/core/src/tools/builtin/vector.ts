import { z } from 'zod';
import { ITool, IToolManifest, ExecutionContext } from '../../tool-registry.js';
import { VectorStorage } from '@memohub/storage-soul';

import { randomUUID } from 'node:crypto';

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
      meta: z.record(z.any()).optional(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
    }),
  };

  constructor(private storage: VectorStorage) {}

  public async execute(input: any, context: ExecutionContext): Promise<{ success: boolean }> {
    const data = {
      id: input.id || randomUUID(),
      vector: input.vector,
      hash: input.hash,
      track_id: input.track_id || 'default',
      entities: input.entities || [],
      timestamp: input.timestamp || new Date().toISOString(),
      ...input.meta,
    };
    await this.storage.add(data);
    return { success: true };
  }
}
