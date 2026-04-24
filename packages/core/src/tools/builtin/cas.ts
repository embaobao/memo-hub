import { z } from 'zod';
import { ITool, IToolManifest, ExecutionContext } from '../../tool-registry.js';
import { ContentAddressableStorage } from '@memohub/storage-flesh';

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

  constructor(private cas: ContentAddressableStorage) {}

  public async execute(input: { content: string }, context: ExecutionContext): Promise<{ hash: string, path: string }> {
    const hash = await this.cas.write(input.content);
    const path = this.cas.blobPath(hash);
    return { hash, path };
  }
}
