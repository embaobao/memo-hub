import { z } from "zod";
import { ToolManifestConfig } from "@memohub/config";
import { IHostResources } from "./types-host.js";

/**
 * 执行上下文
 */
export interface ExecutionContext {
  traceId: string;
  spanId: string;
  state: Record<string, any>;
}

/**
 * 工具元数据
 */
export interface IToolManifest extends ToolManifestConfig {
  id: string;
  type: "builtin" | "extension";
  inputSchema: z.ZodSchema;
  outputSchema: z.ZodSchema;
}

/**
 * 原子化工具接口 (Dify/Node-RED Style Node)
 */
export interface ITool<TInput = any, TOutput = any> {
  manifest: IToolManifest;
  execute(
    input: TInput,
    resources: IHostResources,
    context: ExecutionContext,
  ): Promise<TOutput>;
}

/**
 * 原子工具注册中心
 */
export class ToolRegistry {
  private tools = new Map<string, ITool>();

  /**
   * 注册工具节点
   */
  public register(tool: ITool): void {
    this.tools.set(tool.manifest.id, tool);
  }

  /**
   * 获取工具 (支持简写，如 "cas" 匹配 "builtin:cas")
   */
  public get(id: string): ITool {
    if (this.tools.has(id)) return this.tools.get(id)!;

    const builtinId = `builtin:${id}`;
    if (this.tools.has(builtinId)) return this.tools.get(builtinId)!;

    throw new Error(`[ToolRegistry] 找不到工具节点: ${id}`);
  }

  /**
   * 列出所有已加载节点
   */
  public list(): ITool[] {
    return Array.from(this.tools.values());
  }

  /**
   * 动态加载配置中定义的扩展工具 (TBD)
   */
  public async loadExtensions(configs: ToolManifestConfig[]): Promise<void> {
    // 这里的逻辑将支持从 npm 或 本地路径动态加载
  }
}
