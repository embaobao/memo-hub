import { z } from 'zod';
import { ITool, IToolManifest, ExecutionContext } from '@memohub/core/src/index';
import { IHostResources } from '@memohub/core/src/index';

export class VectorTool implements ITool {
   // @ts-ignore
    public manifest: IToolManifest = {
    id: 'builtin:vector',
    type: 'builtin',
    exposed: true,
    optional: false,
    inputSchema: z.object({
      op: z.enum(['add', 'update', 'delete']).default('add'),
      id: z.string().optional(),
      vector: z.array(z.number()).optional(),
      hash: z.string().optional(),
      track_id: z.string().optional(),
      entities: z.array(z.string()).optional(),
      timestamp: z.string().optional(),
      meta: z.record(z.any()).optional(),
      filter: z.string().optional(), // For delete
      updates: z.record(z.any()).optional(), // For update
    }),
    outputSchema: z.object({
      success: z.boolean(),
    }),
  };

  public async execute(input: any, resources: IHostResources, context: ExecutionContext): Promise<{ success: boolean }> {
    const op = input.op || 'add';

    switch (op) {
      case 'add':
        const data = {
          ...input,
          track_id: input.track_id || 'default',
          entities: input.entities || [],
          timestamp: input.timestamp || new Date().toISOString(),
          ...input.meta,
        };
        // Clean up internal tool fields
        delete data.op;
        delete data.meta;
        await resources.soul.add(data);
        break;

      case 'update':
        if (!input.id) throw new Error("ID is required for vector update");
        await resources.soul.update(input.id, input.updates || {});
        break;

      case 'delete':
        if (!input.filter && !input.id) throw new Error("Filter or ID is required for vector delete");
        const filter = input.filter || `id = '${input.id}'`;
        await resources.soul.delete(filter);
        break;

      default:
        throw new Error(`Unsupported vector operation: ${op}`);
    }

    return { success: true };
  }
}
