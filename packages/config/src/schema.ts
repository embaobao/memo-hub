import { z } from "zod";
import { EventKind } from "@memohub/protocol";

export const ProviderSchema = z
  .object({
    id: z.string().min(1),
    type: z.string().min(1),
    url: z.string().url().optional(),
    apiKey: z.string().optional(),
    config: z.record(z.unknown()).optional(),
  })
  .passthrough();

export const AgentSchema = z
  .object({
    provider: z.string().min(1),
    model: z.string().min(1),
    dimensions: z.number().int().positive().optional(),
    temperature: z.number().min(0).max(2).optional(),
    system: z.string().optional(),
  })
  .passthrough();

export const ToolManifestSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(["builtin", "extension"]).default("extension"),
    package: z.string().optional(),
    module: z.string().optional(),
    config: z.record(z.unknown()).optional(),
    exposed: z.boolean().default(false),
    optional: z.boolean().default(false),
  })
  .passthrough();

export const FlowStepSchema = z
  .object({
    step: z.string().min(1),
    tool: z.string().min(1),
    input: z.union([z.string(), z.record(z.unknown())]).optional(),
    agent: z.string().optional(),
    timeout: z.number().int().positive().optional(),
    on_fail: z
      .union([
        z.literal("skip"),
        z.object({
          action: z.enum(["retry", "abort", "fallback"]),
          limit: z.number().int().positive().optional(),
          fallback_tool: z.string().optional(),
        }),
      ])
      .optional(),
  })
  .passthrough();

/**
 * @internal
 */
export const TrackSchema = z
  .object({
    id: z.string().min(1),
    // Map of MemoOp -> flow
    flows: z.record(z.array(FlowStepSchema)).optional(),
    // Fallback flow if op-specific flow is missing
    flow: z.array(FlowStepSchema).optional(),
  })
  .passthrough();

export const DispatcherSchema = z
  .object({
    flow: z.array(FlowStepSchema).optional(),
    fallback: z.string().min(1).default("memory-object"),
  })
  .passthrough();

/**
 * @internal
 */
export const RoutingRuleSchema = z.object({
  type: z.enum(["file_suffix", "content_keyword", "kind_match", "default"]),
  trackId: z.string().min(1),
  suffixes: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  kind: z.nativeEnum(EventKind).optional(),
});

/**
 * @internal
 */
export const RoutingConfigSchema = z.object({
  enabled: z.boolean().default(true),
  defaultTrack: z.string().default("memory-object"),
  rules: z.array(RoutingRuleSchema).default([]),
});

/**
 * @internal
 */
export const MemoHubConfigSchema = z.object({
  $schema: z.string().url().optional(),
  configVersion: z.string().default("unified-memory-1"),
  version: z.string().optional(),
  system: z
    .object({
      trace_enabled: z.boolean().default(true),
      log_level: z.enum(["debug", "info", "warn", "error"]).default("info"),
      root: z.string().default("~/.memohub"),
      lang: z.enum(["zh", "en", "auto"]).default("auto"),
    })
    .default({}),
  ai: z
    .object({
      providers: z
        .array(ProviderSchema)
        .default([
          { id: "ollama", type: "ollama", url: "http://localhost:11434/v1" },
          { id: "lmstudio", type: "openai-compatible", url: "http://127.0.0.1:1234/v1" },
        ]),
      agents: z.record(AgentSchema).default({
        embedder: {
          provider: "ollama",
          model: "nomic-embed-text-v2-moe",
          dimensions: 768,
        },
        summarizer: {
          provider: "ollama",
          model: "qwen2.5:7b",
        },
      }),
    })
    .default({}),
  storage: z
    .object({
      root: z.string().default("~/.memohub"),
      blobPath: z.string().default("~/.memohub/blobs"),
      vectorDbPath: z.string().default("~/.memohub/data/memohub.lancedb"),
      vectorTable: z.string().default("memohub"),
      dimensions: z.number().int().positive().default(768),
    })
    .default({}),
  mcp: z
    .object({
      enabled: z.boolean().default(true),
      transport: z.enum(["stdio"]).default("stdio"),
      logPath: z.string().default("~/.memohub/logs/mcp.ndjson"),
      toolsResourceUri: z.string().default("memohub://tools"),
      statsResourceUri: z.string().default("memohub://stats"),
      exposeToolCatalog: z.boolean().default(true),
      exposeStatus: z.boolean().default(true),
    })
    .default({}),
  memory: z
    .object({
      queryLayers: z.array(z.string()).default(["self", "project", "global"]),
      views: z.array(z.string()).default(["agent_profile", "recent_activity", "project_context", "coding_context"]),
      operations: z.array(z.string()).default(["ingest", "query", "summarize", "clarification_create", "clarification_resolve"]),
    })
    .default({}),
  dispatcher: DispatcherSchema.default({ fallback: "memory-object" }),
  routing: RoutingConfigSchema.default({}),
  tools: z.array(ToolManifestSchema).default([]),
  tracks: z.array(TrackSchema).default([]),
});

/** @internal */
export type MemoHubConfig = z.infer<typeof MemoHubConfigSchema>;
export type ProviderConfig = z.infer<typeof ProviderSchema>;
export type AgentConfig = z.infer<typeof AgentSchema>;
export type ToolManifestConfig = z.infer<typeof ToolManifestSchema>;
export type FlowStepConfig = z.infer<typeof FlowStepSchema>;
/** @internal */
export type TrackConfig = z.infer<typeof TrackSchema>;
export type DispatcherConfig = z.infer<typeof DispatcherSchema>;
/** @internal */
export type RoutingRuleConfig = z.infer<typeof RoutingRuleSchema>;
/** @internal */
export type RoutingConfig = z.infer<typeof RoutingConfigSchema>;
