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
    providerId: string;
    providerType: string;
    providerUrl: string;
    embeddingModel: string;
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
  const providerId = embedder?.provider ?? config.ai.providers[0]?.id ?? "local";
  const provider = config.ai.providers.find((item) => item.id === providerId) ?? config.ai.providers[0];
  const dimensions = Number(process.env.MEMOHUB_DIMENSIONS ?? config.storage?.dimensions ?? embedder?.dimensions ?? 768);
  const vectorDbPath = process.env.MEMOHUB_DB_PATH ?? config.storage?.vectorDbPath ?? `${root}/data/memohub.lancedb`;
  const blobPath = process.env.MEMOHUB_CAS_PATH ?? config.storage?.blobPath ?? `${root}/blobs`;
  const providerUrl = process.env.EMBEDDING_URL ?? provider?.url ?? "http://localhost:11434/v1";
  const embeddingModel = process.env.EMBEDDING_MODEL ?? embedder?.model ?? "nomic-embed-text";

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
      providerId,
      providerType: provider?.type ?? "ollama",
      providerUrl,
      embeddingModel,
      chatModel: summarizer?.model ?? "qwen2.5:7b",
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
      operations: config.memory?.operations ?? ["ingest_event", "query", "summarize", "clarify", "resolve_clarification"],
    },
    sources: config._sources ?? [],
  };
}
