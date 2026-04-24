import { z } from 'zod';

export const ProviderSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  url: z.string().url().optional(),
  apiKey: z.string().optional(),
  config: z.record(z.unknown()).optional(),
}).passthrough();

export const AgentSchema = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
  dimensions: z.number().int().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
  system: z.string().optional(),
}).passthrough();

export const ToolManifestSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['builtin', 'extension']).default('extension'),
  package: z.string().optional(),
  module: z.string().optional(),
  config: z.record(z.unknown()).optional(),
  exposed: z.boolean().default(false),
  optional: z.boolean().default(false),
}).passthrough();

export const FlowStepSchema = z.object({
  step: z.string().min(1),
  tool: z.string().min(1),
  input: z.union([z.string(), z.record(z.unknown())]).optional(),
  agent: z.string().optional(),
  timeout: z.number().int().positive().optional(),
  on_fail: z.union([
    z.literal('skip'),
    z.object({
      action: z.enum(['retry', 'abort', 'fallback']),
      limit: z.number().int().positive().optional(),
      fallback_tool: z.string().optional()
    })
  ]).optional()
}).passthrough();

export const TrackSchema = z.object({
  id: z.string().min(1),
  flow: z.array(FlowStepSchema).min(1),
}).passthrough();

export const DispatcherSchema = z.object({
  flow: z.array(FlowStepSchema).optional(),
  fallback: z.string().min(1)
}).passthrough();

export const MemoHubConfigSchema = z.object({
  $schema: z.string().url().optional(),
  version: z.string().optional(),
  system: z.object({
    trace_enabled: z.boolean().default(true),
    log_level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    root: z.string().default('~/.memohub'),
  }).default({}),
  ai: z.object({
    providers: z.array(ProviderSchema).default([]),
    agents: z.record(AgentSchema).default({}),
  }).default({}),
  dispatcher: DispatcherSchema.default({ fallback: 'track-insight' }),
  tools: z.array(ToolManifestSchema).default([]),
  tracks: z.array(TrackSchema).default([]),
});

export type MemoHubConfig = z.infer<typeof MemoHubConfigSchema>;
export type ProviderConfig = z.infer<typeof ProviderSchema>;
export type AgentConfig = z.infer<typeof AgentSchema>;
export type ToolManifestConfig = z.infer<typeof ToolManifestSchema>;
export type FlowStepConfig = z.infer<typeof FlowStepSchema>;
export type TrackConfig = z.infer<typeof TrackSchema>;
export type DispatcherConfig = z.infer<typeof DispatcherSchema>;
