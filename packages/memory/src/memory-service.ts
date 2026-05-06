import type { ChannelListFilters, ChannelOpenRequest, ChannelRegistryEntry } from "@memohub/channel";
import type { ClarificationResolutionRequest, UnifiedMemoryRuntime } from "./unified-memory-runtime.js";
import {
  buildMemoryEvent,
  ingestMemory,
  queryMemoryView,
  runAgentOperation,
  type AgentOperationCliRequest,
  type MemoryIngestRequest,
  type ViewQueryRequest,
} from "./memory-interface.js";
import {
  buildHermesMemoryEvent,
  extractHermesMemoryCandidates,
  type HermesMemoryCandidate,
  type HermesMemoryWriteRequest,
} from "./memory-write.js";
import {
  buildMemoryOverview,
  prefetchHermesMemory,
  type HermesPrefetchSummary,
  type MemoryOverviewEntry,
} from "./memory-read.js";

export interface MemoryGovernanceAdapters {
  queryLogs?: (input: Record<string, unknown>) => Promise<unknown>;
  cleanMemory?: (input: Record<string, unknown>) => Promise<unknown>;
}

/**
 * MemoryService 是新的统一业务入口。CLI/MCP 只表达 Connector 语义，
 * 具体记忆读写、列表、澄清和 Hermes 预取都走这里。
 */
export class MemoryService {
  constructor(
    private readonly runtime: UnifiedMemoryRuntime,
    private readonly governance: MemoryGovernanceAdapters = {},
  ) {}

  async initialize(): Promise<void> {
    await this.runtime.initialize();
  }

  openChannel(request: ChannelOpenRequest): { reused: boolean; entry: ChannelRegistryEntry } {
    return this.runtime.openChannel(request);
  }

  listChannels(filters?: ChannelListFilters): ChannelRegistryEntry[] {
    return this.runtime.listChannels(filters);
  }

  getChannel(channelId: string): ChannelRegistryEntry | undefined {
    return this.runtime.getChannel(channelId);
  }

  useChannel(channelId: string): ChannelRegistryEntry {
    return this.runtime.useChannel(channelId);
  }

  closeChannel(channelId: string): ChannelRegistryEntry {
    return this.runtime.closeChannel(channelId);
  }

  async writeMemory(request: MemoryIngestRequest) {
    return ingestMemory(this.runtime, request);
  }

  async writeHermesMemory(request: HermesMemoryWriteRequest) {
    return this.runtime.ingest(buildHermesMemoryEvent(request));
  }

  async writeHermesCandidates(candidates: HermesMemoryCandidate[]) {
    const results = [];
    for (const candidate of candidates) {
      results.push(await this.writeHermesMemory(candidate));
    }
    return results;
  }

  buildMemoryEvent(request: MemoryIngestRequest) {
    return buildMemoryEvent(request);
  }

  async queryMemory(request: ViewQueryRequest) {
    return queryMemoryView(this.runtime, request);
  }

  async listMemory(input: Parameters<UnifiedMemoryRuntime["listMemories"]>[0]) {
    return this.runtime.listMemories(input);
  }

  async listOverview(limit = 20): Promise<MemoryOverviewEntry[]> {
    const memories = await this.runtime.listMemories({ perspective: "global", limit: Math.max(limit * 5, 50) });
    return buildMemoryOverview(memories, limit);
  }

  async prefetchHermes(input: {
    actorId: string;
    projectId: string;
    channel: {
      channelId: string;
      actorId: string;
      source: string;
      projectId: string;
      purpose: string;
      sessionId?: string;
    };
    limit?: number;
  }): Promise<HermesPrefetchSummary> {
    return prefetchHermesMemory(this.runtime, input);
  }

  extractHermesCandidates(input: Parameters<typeof extractHermesMemoryCandidates>[0]) {
    return extractHermesMemoryCandidates(input);
  }

  async createClarification(request: AgentOperationCliRequest) {
    return runAgentOperation(request);
  }

  async resolveClarification(request: ClarificationResolutionRequest) {
    return this.runtime.resolveClarification(request);
  }

  async queryLogs(input: Record<string, unknown>) {
    if (!this.governance.queryLogs) {
      throw new Error("queryLogs adapter is not configured for this MemoryService.");
    }
    return this.governance.queryLogs(input);
  }

  async cleanMemory(input: Record<string, unknown>) {
    if (!this.governance.cleanMemory) {
      throw new Error("cleanMemory adapter is not configured for this MemoryService.");
    }
    return this.governance.cleanMemory(input);
  }

  async inspect() {
    return this.runtime.inspect();
  }
}
