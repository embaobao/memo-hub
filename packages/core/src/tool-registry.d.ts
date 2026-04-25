import { z } from 'zod';
import { ToolManifestConfig } from '@memohub/config';
import { IHostResources } from './types-host.js';
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
    type: 'builtin' | 'extension';
    inputSchema: z.ZodSchema;
    outputSchema: z.ZodSchema;
}
/**
 * 原子化工具接口 (Dify/Node-RED Style Node)
 */
export interface ITool<TInput = any, TOutput = any> {
    manifest: IToolManifest;
    execute(input: TInput, resources: IHostResources, context: ExecutionContext): Promise<TOutput>;
}
/**
 * 原子工具注册中心
 */
export declare class ToolRegistry {
    private tools;
    /**
     * 注册工具节点
     */
    register(tool: ITool): void;
    /**
     * 获取工具 (支持简写，如 "cas" 匹配 "builtin:cas")
     */
    get(id: string): ITool;
    /**
     * 列出所有已加载节点
     */
    list(): ITool[];
    /**
     * 动态加载配置中定义的扩展工具 (TBD)
     */
    loadExtensions(configs: ToolManifestConfig[]): Promise<void>;
}
//# sourceMappingURL=tool-registry.d.ts.map