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

export function loadRuntimeConfig(loader = new ConfigLoader()): ResolvedMemoHubRuntimeConfig {
  const config = loader.getConfig();
  return resolveRuntimeConfig(config);
}

export function resolveRuntimeConfig(config: EnhancedConfig): ResolvedMemoHubRuntimeConfig {
  const root = resolvePath(config.storage?.root ?? config.system?.root ?? "~/.memohub");
  const embedder = config.ai.agents.embedder;
  const summarizer = config.ai.agents.summarizer;
  const embedderProviderId = embedder?.provider ?? config.ai.providers[0]?.id ?? "ollama";
  const summarizerProviderId = summarizer?.provider ?? embedderProviderId;
  const embedderProvider = config.ai.providers.find((item) => item.id === embedderProviderId) ?? config.ai.providers[0];
  const summarizerProvider = config.ai.providers.find((item) => item.id === summarizerProviderId) ?? embedderProvider;
  const dimensions = Number(process.env.MEMOHUB_DIMENSIONS ?? config.storage?.dimensions ?? embedder?.dimensions ?? 768);
  const vectorDbPath = process.env.MEMOHUB_DB_PATH ?? config.storage?.vectorDbPath ?? `${root}/data/memohub.lancedb`;
  const blobPath = process.env.MEMOHUB_CAS_PATH ?? config.storage?.blobPath ?? `${root}/blobs`;
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
      blobPath: resolvePath(blobPath),
      vectorDbPath: resolvePath(vectorDbPath),
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
      logPath: resolvePath(config.mcp?.logPath ?? `${root}/logs/mcp.ndjson`),
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
