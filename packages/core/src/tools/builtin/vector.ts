import { z } from 'zod';
import { ITool, IToolManifest, ExecutionContext } from '../../tool-registry.js';
import { VectorStorage } from '@memohub/storage-soul';

export class VectorTool implements ITool {
  public manifest: IToolManifest = {
    id: 'builtin:vector',
    type: 'builtin',
    exposed: true,
    optional: false,
    inputSchema: z.object({
      id: z.string(),
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
    await this.storage.add(input);
    return { success: true };
  }
}
