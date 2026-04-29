import { z } from "zod";
import {
  ITool,
  IToolManifest,
  ExecutionContext,
} from "@memohub/core";
import { IHostResources } from "@memohub/core";

export class CasTool implements ITool {
   // @ts-ignore
    public manifest: IToolManifest = {
    id: "builtin:cas",
    type: "builtin",
    exposed: true,
    optional: false,
    inputSchema: z.object({
      op: z.enum(["write", "read"]).default("write"),
      content: z.string().optional(), // For write
      hash: z.string().optional(), // For read
    }),
    outputSchema: z.object({
      hash: z.string().optional(),
      path: z.string().optional(),
      content: z.string().optional(),
    }),
  };

  public async execute(
    input: { op?: string; content?: string; hash?: string },
    resources: IHostResources,
    context: ExecutionContext,
  ): Promise<{ hash?: string; path?: string; content?: string }> {
    const op = input.op || "write";

    if (op === "write") {
      if (!input.content) throw new Error("Content is required for CAS write");
      const hash = await resources.flesh.write(input.content);
      // Cast to any to access implementation-specific blobPath if available
      const flesh = resources.flesh as any;
      const path = typeof flesh.blobPath === "function"
        ? flesh.blobPath(hash)
        : hash;
      return { hash, path };
    } else if (op === "read") {
      if (!input.hash) throw new Error("Hash is required for CAS read");
      const content = await resources.flesh.read(input.hash);
      return { content };
    } else {
      throw new Error(`Unsupported CAS operation: ${op}`);
    }
  }
}
