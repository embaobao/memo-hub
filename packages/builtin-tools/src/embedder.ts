import { z } from "zod";
import {
  ITool,
  IToolManifest,
  ExecutionContext,
} from "@memohub/core/src/index";
import { IHostResources } from "@memohub/core/src/index";

export class EmbedderTool implements ITool {
   // @ts-ignore
    public manifest: IToolManifest = {
    id: "builtin:embedder",
    type: "builtin",
    exposed: true,
    optional: false,
    inputSchema: z.object({
      text: z.string().min(1),
      agent: z.string().default("embedder"),
    }),
    outputSchema: z.object({
      vector: z.array(z.number()),
    }),
  };

  public async execute(
    input: { text: string; agent?: string },
    resources: IHostResources,
    context: ExecutionContext,
  ): Promise<{ vector: number[] }> {
    const agentId = input.agent || "embedder";
    const embedder = resources.ai.getEmbedder(agentId);
    const vector = await embedder.embed(input.text);
    return { vector };
  }
}
