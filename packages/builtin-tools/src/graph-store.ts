import { z } from "zod";
import {
  ITool,
  IToolManifest,
  ExecutionContext,
} from "@memohub/core/src/index";
import { IHostResources } from "@memohub/core/src/index";
import * as fs from "node:fs";
import * as path from "node:path";
import { resolvePath } from "@memohub/config";

export class GraphStoreTool implements ITool {
   // @ts-ignore
    public manifest: IToolManifest = {
    id: "builtin:graph-store",
    type: "builtin",
    exposed: true,
    optional: true,
    inputSchema: z.object({
      op: z.enum(["add", "query"]),
      subject: z.string(),
      predicate: z.string().optional(),
      object: z.string().optional(),
    }),
    outputSchema: z.object({
      triples: z.array(z.any()),
    }),
  };

  private dbPath: string;

  constructor(root: string) {
    this.dbPath = path.join(resolvePath(root), "data", "relations.ndjson");
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  public async execute(
    input: any,
    resources: IHostResources,
    context: ExecutionContext,
  ): Promise<{ triples: any[] }> {
    if (input.op === "add") {
      const triple = {
        s: input.subject,
        p: input.predicate,
        o: input.object,
        timestamp: new Date().toISOString(),
      };
      fs.appendFileSync(this.dbPath, JSON.stringify(triple) + "\n", "utf-8");
      return { triples: [triple] };
    } else {
      // Simple linear scan for now
      if (!fs.existsSync(this.dbPath)) return { triples: [] };
      const lines = fs
        .readFileSync(this.dbPath, "utf-8")
        .split("\n")
        .filter(Boolean);
      const results = lines
        .map((l) => JSON.parse(l))
        .filter((t) => t.s === input.subject || t.o === input.subject);
      return { triples: results };
    }
  }
}
