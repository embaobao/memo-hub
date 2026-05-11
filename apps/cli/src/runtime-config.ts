import { ConfigLoader, resolvePath, type EnhancedConfig } from "@memohub/config";
import { CLI_METADATA } from "./interface-metadata.js";

export interface ResolvedMemoHubRuntimeConfig {
  version: string;
  configVersion: string;
  root: string;
  registry: {
    channelRegistryPath: string;
  };
  storage: {
    blobPath: string;
    vectorDbPath: string;
    vectorTable: string;
    dimensions: number;
  };
  ai: {
    embedderProviderId: string;
    embedderProviderType: string;
    embedderProviderUrl: string;
    embeddingModel: string;
    summarizerProviderId: string;
    summarizerProviderType: string;
    summarizerProviderUrl: string;
    chatModel: string;
    dimensions: number;
  };
  mcp: {
    enabled: boolean;
    transport: "stdio";
    logPath: string;
    toolsResourceUri: string;
    statsResourceUri: string;
    exposeToolCatalog: boolean;
    exposeStatus: boolean;
  };
  memory: {
    queryLayers: string[];
    views: string[];
    operations: string[];
  };
  sources: string[];
}

const DEFAULT_ROOT = "~/.memohub";

function resolveManagedRoot(config: EnhancedConfig): string {
  return resolvePath(
    process.env.MEMOHUB_STORAGE__ROOT ??
    config.storage?.root ??
    process.env.MEMOHUB_SYSTEM__ROOT ??
    config.system?.root ??
    DEFAULT_ROOT,
  );
}

function resolveManagedPath(override: string | undefined, configuredPath: string | undefined, fallbackPath: string): string {
  return resolvePath(override ?? configuredPath ?? fallbackPath);
}

export function loadRuntimeConfig(loader = new ConfigLoader()): ResolvedMemoHubRuntimeConfig {
  const config = loader.getConfig();
  return resolveRuntimeConfig(config);
}

export function resolveRuntimeConfig(config: EnhancedConfig): ResolvedMemoHubRuntimeConfig {
  const root = resolveManagedRoot(config);
  const embedder = config.ai.agents.embedder;
  const summarizer = config.ai.agents.summarizer;
  const embedderProviderId = embedder?.provider ?? config.ai.providers[0]?.id ?? "ollama";
  const summarizerProviderId = summarizer?.provider ?? embedderProviderId;
  const embedderProvider = config.ai.providers.find((item) => item.id === embedderProviderId) ?? config.ai.providers[0];
  const summarizerProvider = config.ai.providers.find((item) => item.id === summarizerProviderId) ?? embedderProvider;
  const dimensions = Number(process.env.MEMOHUB_DIMENSIONS ?? config.storage?.dimensions ?? embedder?.dimensions ?? 768);
  const vectorDbPath = resolveManagedPath(
    process.env.MEMOHUB_STORAGE__VECTOR_DB_PATH ?? process.env.MEMOHUB_DB_PATH,
    config.storage?.vectorDbPath,
    `${root}/data/memohub.lancedb`,
  );
  const blobPath = resolveManagedPath(
    process.env.MEMOHUB_STORAGE__BLOB_PATH ?? process.env.MEMOHUB_CAS_PATH,
    config.storage?.blobPath,
    `${root}/blobs`,
  );
  const logPath = resolveManagedPath(
    process.env.MEMOHUB_MCP__LOG_PATH,
    config.mcp?.logPath,
    `${root}/logs/mcp.ndjson`,
  );
  const embedderProviderUrl = process.env.EMBEDDING_URL ?? embedderProvider?.url ?? "http://localhost:11434/v1";
  const summarizerProviderUrl = process.env.SUMMARIZER_URL ?? summarizerProvider?.url ?? embedderProviderUrl;
  const embeddingModel = process.env.EMBEDDING_MODEL ?? embedder?.model ?? "nomic-embed-text";
  const chatModel = process.env.SUMMARIZER_MODEL ?? summarizer?.model ?? "qwen2.5:7b";

  return {
    version: CLI_METADATA.version,
    configVersion: config.configVersion ?? "unified-memory-1",
    root,
    registry: {
      channelRegistryPath: `${root}/state/channels.json`,
    },
    storage: {
      blobPath,
      vectorDbPath,
      vectorTable: config.storage?.vectorTable ?? "memohub",
      dimensions,
    },
    ai: {
      embedderProviderId,
      embedderProviderType: embedderProvider?.type ?? "ollama",
      embedderProviderUrl,
      embeddingModel,
      summarizerProviderId,
      summarizerProviderType: summarizerProvider?.type ?? embedderProvider?.type ?? "ollama",
      summarizerProviderUrl,
      chatModel,
      dimensions,
    },
    mcp: {
      enabled: config.mcp?.enabled ?? true,
      transport: "stdio",
      logPath,
      toolsResourceUri: config.mcp?.toolsResourceUri ?? "memohub://tools",
      statsResourceUri: config.mcp?.statsResourceUri ?? "memohub://stats",
      exposeToolCatalog: config.mcp?.exposeToolCatalog ?? true,
      exposeStatus: config.mcp?.exposeStatus ?? true,
    },
    memory: {
      queryLayers: config.memory?.queryLayers ?? ["self", "project", "global"],
      views: config.memory?.views ?? ["agent_profile", "recent_activity", "project_context", "coding_context"],
      operations: config.memory?.operations ?? ["ingest", "query", "summarize", "clarification_create", "clarification_resolve"],
    },
    sources: config._sources ?? [],
  };
}
