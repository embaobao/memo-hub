import { MemoHubConfig } from '@memohub/config';
import { IKernel, Text2MemInstruction, Text2MemResult, ITrackProvider, ICAS, IVectorStorage, IEmbedder, ICompleter } from '@memohub/protocol';
import { ToolRegistry } from './tool-registry.js';
import { ContentAddressableStorage } from '@memohub/storage-flesh';
import { VectorStorage } from '@memohub/storage-soul';
/**
 * MemoHub 核心内核 (Memory Kernel)
 * 职责: 协调原子工具与流编排引擎。
 */
export declare class MemoryKernel implements IKernel {
    private config;
    private aiHub;
    private toolRegistry;
    private flowEngine;
    private observation;
    private cache;
    private sessionCache;
    private cas;
    private vectorStorage;
    private hostResources;
    private tracks;
    constructor(config: MemoHubConfig);
    initialize(): Promise<void>;
    /**
     * 注册轨道提供者
     */
    registerTrack(track: ITrackProvider): Promise<void>;
    dispatch(instruction: Text2MemInstruction): Promise<Text2MemResult>;
    getEmbedder(agentId?: string): import("@memohub/ai-provider").IEmbedder;
    getCompleter(agentId?: string): import("@memohub/ai-provider").ICompleter;
    getCAS(): ContentAddressableStorage;
    getVectorStorage(): VectorStorage;
    getConfig(): {
        system: {
            trace_enabled: boolean;
            log_level: "debug" | "info" | "warn" | "error";
            root: string;
        };
        ai: {
            providers: import("zod").objectOutputType<{
                id: import("zod").ZodString;
                type: import("zod").ZodString;
                url: import("zod").ZodOptional<import("zod").ZodString>;
                apiKey: import("zod").ZodOptional<import("zod").ZodString>;
                config: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            }, import("zod").ZodTypeAny, "passthrough">[];
            agents: Record<string, import("zod").objectOutputType<{
                provider: import("zod").ZodString;
                model: import("zod").ZodString;
                dimensions: import("zod").ZodOptional<import("zod").ZodNumber>;
                temperature: import("zod").ZodOptional<import("zod").ZodNumber>;
                system: import("zod").ZodOptional<import("zod").ZodString>;
            }, import("zod").ZodTypeAny, "passthrough">>;
        };
        dispatcher: {
            fallback: string;
            flow?: import("zod").objectOutputType<{
                step: import("zod").ZodString;
                tool: import("zod").ZodString;
                input: import("zod").ZodOptional<import("zod").ZodUnion<[import("zod").ZodString, import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>]>>;
                agent: import("zod").ZodOptional<import("zod").ZodString>;
                timeout: import("zod").ZodOptional<import("zod").ZodNumber>;
                on_fail: import("zod").ZodOptional<import("zod").ZodUnion<[import("zod").ZodLiteral<"skip">, import("zod").ZodObject<{
                    action: import("zod").ZodEnum<["retry", "abort", "fallback"]>;
                    limit: import("zod").ZodOptional<import("zod").ZodNumber>;
                    fallback_tool: import("zod").ZodOptional<import("zod").ZodString>;
                }, "strip", import("zod").ZodTypeAny, {
                    action: "retry" | "abort" | "fallback";
                    limit?: number | undefined;
                    fallback_tool?: string | undefined;
                }, {
                    action: "retry" | "abort" | "fallback";
                    limit?: number | undefined;
                    fallback_tool?: string | undefined;
                }>]>>;
            }, import("zod").ZodTypeAny, "passthrough">[] | undefined;
        } & {
            [k: string]: unknown;
        };
        tools: import("zod").objectOutputType<{
            id: import("zod").ZodString;
            type: import("zod").ZodDefault<import("zod").ZodEnum<["builtin", "extension"]>>;
            package: import("zod").ZodOptional<import("zod").ZodString>;
            module: import("zod").ZodOptional<import("zod").ZodString>;
            config: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
            exposed: import("zod").ZodDefault<import("zod").ZodBoolean>;
            optional: import("zod").ZodDefault<import("zod").ZodBoolean>;
        }, import("zod").ZodTypeAny, "passthrough">[];
        tracks: import("zod").objectOutputType<{
            id: import("zod").ZodString;
            flows: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodArray<import("zod").ZodObject<{
                step: import("zod").ZodString;
                tool: import("zod").ZodString;
                input: import("zod").ZodOptional<import("zod").ZodUnion<[import("zod").ZodString, import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>]>>;
                agent: import("zod").ZodOptional<import("zod").ZodString>;
                timeout: import("zod").ZodOptional<import("zod").ZodNumber>;
                on_fail: import("zod").ZodOptional<import("zod").ZodUnion<[import("zod").ZodLiteral<"skip">, import("zod").ZodObject<{
                    action: import("zod").ZodEnum<["retry", "abort", "fallback"]>;
                    limit: import("zod").ZodOptional<import("zod").ZodNumber>;
                    fallback_tool: import("zod").ZodOptional<import("zod").ZodString>;
                }, "strip", import("zod").ZodTypeAny, {
                    action: "retry" | "abort" | "fallback";
                    limit?: number | undefined;
                    fallback_tool?: string | undefined;
                }, {
                    action: "retry" | "abort" | "fallback";
                    limit?: number | undefined;
                    fallback_tool?: string | undefined;
                }>]>>;
            }, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{
                step: import("zod").ZodString;
                tool: import("zod").ZodString;
                input: import("zod").ZodOptional<import("zod").ZodUnion<[import("zod").ZodString, import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>]>>;
                agent: import("zod").ZodOptional<import("zod").ZodString>;
                timeout: import("zod").ZodOptional<import("zod").ZodNumber>;
                on_fail: import("zod").ZodOptional<import("zod").ZodUnion<[import("zod").ZodLiteral<"skip">, import("zod").ZodObject<{
                    action: import("zod").ZodEnum<["retry", "abort", "fallback"]>;
                    limit: import("zod").ZodOptional<import("zod").ZodNumber>;
                    fallback_tool: import("zod").ZodOptional<import("zod").ZodString>;
                }, "strip", import("zod").ZodTypeAny, {
                    action: "retry" | "abort" | "fallback";
                    limit?: number | undefined;
                    fallback_tool?: string | undefined;
                }, {
                    action: "retry" | "abort" | "fallback";
                    limit?: number | undefined;
                    fallback_tool?: string | undefined;
                }>]>>;
            }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
                step: import("zod").ZodString;
                tool: import("zod").ZodString;
                input: import("zod").ZodOptional<import("zod").ZodUnion<[import("zod").ZodString, import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>]>>;
                agent: import("zod").ZodOptional<import("zod").ZodString>;
                timeout: import("zod").ZodOptional<import("zod").ZodNumber>;
                on_fail: import("zod").ZodOptional<import("zod").ZodUnion<[import("zod").ZodLiteral<"skip">, import("zod").ZodObject<{
                    action: import("zod").ZodEnum<["retry", "abort", "fallback"]>;
                    limit: import("zod").ZodOptional<import("zod").ZodNumber>;
                    fallback_tool: import("zod").ZodOptional<import("zod").ZodString>;
                }, "strip", import("zod").ZodTypeAny, {
                    action: "retry" | "abort" | "fallback";
                    limit?: number | undefined;
                    fallback_tool?: string | undefined;
                }, {
                    action: "retry" | "abort" | "fallback";
                    limit?: number | undefined;
                    fallback_tool?: string | undefined;
                }>]>>;
            }, import("zod").ZodTypeAny, "passthrough">>, "many">>>;
            flow: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
                step: import("zod").ZodString;
                tool: import("zod").ZodString;
                input: import("zod").ZodOptional<import("zod").ZodUnion<[import("zod").ZodString, import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>]>>;
                agent: import("zod").ZodOptional<import("zod").ZodString>;
                timeout: import("zod").ZodOptional<import("zod").ZodNumber>;
                on_fail: import("zod").ZodOptional<import("zod").ZodUnion<[import("zod").ZodLiteral<"skip">, import("zod").ZodObject<{
                    action: import("zod").ZodEnum<["retry", "abort", "fallback"]>;
                    limit: import("zod").ZodOptional<import("zod").ZodNumber>;
                    fallback_tool: import("zod").ZodOptional<import("zod").ZodString>;
                }, "strip", import("zod").ZodTypeAny, {
                    action: "retry" | "abort" | "fallback";
                    limit?: number | undefined;
                    fallback_tool?: string | undefined;
                }, {
                    action: "retry" | "abort" | "fallback";
                    limit?: number | undefined;
                    fallback_tool?: string | undefined;
                }>]>>;
            }, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{
                step: import("zod").ZodString;
                tool: import("zod").ZodString;
                input: import("zod").ZodOptional<import("zod").ZodUnion<[import("zod").ZodString, import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>]>>;
                agent: import("zod").ZodOptional<import("zod").ZodString>;
                timeout: import("zod").ZodOptional<import("zod").ZodNumber>;
                on_fail: import("zod").ZodOptional<import("zod").ZodUnion<[import("zod").ZodLiteral<"skip">, import("zod").ZodObject<{
                    action: import("zod").ZodEnum<["retry", "abort", "fallback"]>;
                    limit: import("zod").ZodOptional<import("zod").ZodNumber>;
                    fallback_tool: import("zod").ZodOptional<import("zod").ZodString>;
                }, "strip", import("zod").ZodTypeAny, {
                    action: "retry" | "abort" | "fallback";
                    limit?: number | undefined;
                    fallback_tool?: string | undefined;
                }, {
                    action: "retry" | "abort" | "fallback";
                    limit?: number | undefined;
                    fallback_tool?: string | undefined;
                }>]>>;
            }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
                step: import("zod").ZodString;
                tool: import("zod").ZodString;
                input: import("zod").ZodOptional<import("zod").ZodUnion<[import("zod").ZodString, import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>]>>;
                agent: import("zod").ZodOptional<import("zod").ZodString>;
                timeout: import("zod").ZodOptional<import("zod").ZodNumber>;
                on_fail: import("zod").ZodOptional<import("zod").ZodUnion<[import("zod").ZodLiteral<"skip">, import("zod").ZodObject<{
                    action: import("zod").ZodEnum<["retry", "abort", "fallback"]>;
                    limit: import("zod").ZodOptional<import("zod").ZodNumber>;
                    fallback_tool: import("zod").ZodOptional<import("zod").ZodString>;
                }, "strip", import("zod").ZodTypeAny, {
                    action: "retry" | "abort" | "fallback";
                    limit?: number | undefined;
                    fallback_tool?: string | undefined;
                }, {
                    action: "retry" | "abort" | "fallback";
                    limit?: number | undefined;
                    fallback_tool?: string | undefined;
                }>]>>;
            }, import("zod").ZodTypeAny, "passthrough">>, "many">>;
        }, import("zod").ZodTypeAny, "passthrough">[];
        $schema?: string | undefined;
        version?: string | undefined;
    };
    getToolRegistry(): ToolRegistry;
    listTools(): Promise<import("./tool-registry.js").IToolManifest[]>;
    listTracks(): Promise<ITrackProvider[]>;
    clearCache(): void;
    setComponents(components: {
        cas: ICAS;
        vector: IVectorStorage;
        embedder: IEmbedder;
        completer?: ICompleter;
    }): void;
}
//# sourceMappingURL=kernel.d.ts.map