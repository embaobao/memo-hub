import { z } from 'zod';
import { ITool, IToolManifest, ExecutionContext } from '../../tool-registry.js';
import { AIHub } from '../../ai-hub.js';

export class EmbedderTool implements ITool {
  public manifest: IToolManifest = {
    id: 'builtin:embedder',
    type: 'builtin',
    exposed: true,
    optional: false,
    inputSchema: z.object({
      text: z.string().min(1),
      agent: z.string().default('embedder'),
    }),
    outputSchema: z.object({
      vector: z.array(z.number()),
    }),
  };

  constructor(private aiHub: AIHub) {}

  public async execute(input: { text: string, agent?: string }, context: ExecutionContext): Promise<{ vector: number[] }> {
    const agentId = input.agent || 'embedder';
    const embedder = this.aiHub.getEmbedder(agentId);
    const vector = await embedder.embed(input.text);
    return { vector };
  }
}
