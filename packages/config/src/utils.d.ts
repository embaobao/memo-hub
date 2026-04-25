/**
 * Apply environment variable overrides using MEMOHUB_ prefix and __ separator.
 * Example: MEMOHUB_AI__AGENTS__EMBEDDER__MODEL=llama3 -> config.ai.agents.embedder.model = "llama3"
 */
export declare function applyEnvOverrides(config: Record<string, any>): Record<string, any>;
/**
 * Resolve XDG paths and home directory tildes.
 */
export declare function resolvePath(inputPath: string): string;
/**
 * Mask sensitive fields in the configuration for safe reflection/logging.
 */
export declare function maskSecrets(config: Record<string, any>): Record<string, any>;
/**
 * Resolve dynamic secrets (env:// prefix) in the configuration.
 */
export declare function resolveSecrets(config: Record<string, any>): Record<string, any>;
//# sourceMappingURL=utils.d.ts.map