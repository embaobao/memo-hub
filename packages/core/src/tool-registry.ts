import { z } from 'zod';
import { ToolManifestConfig } from '@memohub/config';
import { IHostResources } from './types-host.js';

export interface ExecutionContext {
  traceId: string;
  spanId: string;
  state: Record<string, any>;
}

export interface IToolManifest extends ToolManifestConfig {
  id: string;
  type: 'builtin' | 'extension';
  inputSchema: z.ZodSchema;
  outputSchema: z.ZodSchema;
}

export interface ITool<TInput = any, TOutput = any> {
  manifest: IToolManifest;
  execute(input: TInput, resources: IHostResources, context: ExecutionContext): Promise<TOutput>;
}

export class ToolRegistry {
  private tools = new Map<string, ITool>();

  public register(tool: ITool): void {
    this.tools.set(tool.manifest.id, tool);
  }

  public get(id: string): ITool {
    const tool = this.tools.get(id);
    if (!tool) throw new Error(`Tool not found: ${id}`);
    return tool;
  }

  public list(): ITool[] {
    return Array.from(this.tools.values());
  }
}
