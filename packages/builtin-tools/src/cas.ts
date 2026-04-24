import { z } from 'zod';
import { ITool, IToolManifest, ExecutionContext } from '@memohub/core/src/index';
import { IHostResources } from '@memohub/core/src/index';

export class CasTool implements ITool {
  public manifest: IToolManifest = {
    id: 'builtin:cas',
    type: 'builtin',
    exposed: true,
    optional: false,
    inputSchema: z.object({
      content: z.string().min(1),
    }),
    outputSchema: z.object({
      hash: z.string(),
      path: z.string(),
    }),
  };

  public async execute(input: { content: string }, resources: IHostResources, context: ExecutionContext): Promise<{ hash: string, path: string }> {
    const hash = await resources.flesh.write(input.content);
    // @ts-ignore - blobPath might be internal but we know it exists in this implementation
    const path = resources.flesh.blobPath ? resources.flesh.blobPath(hash) : hash;
    return { hash, path };
  }
}
