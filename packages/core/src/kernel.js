import { AIHub } from './ai-hub.js';
import { ToolRegistry } from './tool-registry.js';
import { FlowEngine } from './flow-engine.js';
import { ObservationKernel } from './observation.js';
import { CacheManager } from './cache.js';
import { SessionCacheLayer } from './session-cache.js';
import { ContentAddressableStorage } from '@memohub/storage-flesh';
import { VectorStorage } from '@memohub/storage-soul';
/**
 * MemoHub 核心内核 (Memory Kernel)
 * 职责: 协调原子工具与流编排引擎。
 */
export class MemoryKernel {
    config;
    aiHub;
    toolRegistry;
    flowEngine;
    observation;
    cache;
    sessionCache;
    cas;
    vectorStorage;
    hostResources;
    tracks = new Map();
    constructor(config) {
        this.config = config;
        this.aiHub = new AIHub(config.ai.providers, config.ai.agents);
        this.toolRegistry = new ToolRegistry();
        this.observation = new ObservationKernel(config.system.root);
        this.cache = new CacheManager(config.system.root);
        this.sessionCache = new SessionCacheLayer();
        this.cas = new ContentAddressableStorage(config.system.root + '/blobs');
        this.vectorStorage = new VectorStorage({
            dbPath: config.system.root + '/data/memohub.lancedb',
            tableName: 'memohub',
            dimensions: config.ai.agents.embedder?.dimensions || 768
        });
        this.hostResources = {
            kernel: this,
            flesh: this.cas,
            soul: this.vectorStorage,
            sessionCache: this.sessionCache,
            ai: {
                getEmbedder: (id) => this.aiHub.getEmbedder(id || 'embedder'),
                getCompleter: (id) => this.aiHub.getCompleter(id || 'summarizer'),
            },
            logger: {
                log: (msg, level = 'info') => console.log(`[${level.toUpperCase()}] ${msg}`)
            }
        };
        this.flowEngine = new FlowEngine(this.toolRegistry, this.observation, this.aiHub, this.cache, this.hostResources);
    }
    async initialize() {
        await this.vectorStorage.initialize();
    }
    /**
     * 注册轨道提供者
     */
    async registerTrack(track) {
        this.tracks.set(track.id, track);
        await track.initialize(this);
    }
    async dispatch(instruction) {
        const traceId = this.observation.createTraceId();
        const trackId = instruction.trackId || this.config.dispatcher.fallback;
        try {
            // 1. 优先尝试配置驱动的 Flow
            const trackConfig = this.config.tracks.find(t => t.id === trackId);
            if (trackConfig) {
                const flow = (trackConfig.flows && trackConfig.flows[instruction.op]) || trackConfig.flow;
                if (flow && flow.length > 0) {
                    const output = await this.flowEngine.executeFlow(flow, instruction.payload, traceId);
                    return { success: true, data: output, meta: { traceId, trackId } };
                }
            }
            // 2. 兜底尝试编程式轨道
            const provider = this.tracks.get(trackId);
            if (provider) {
                const result = await provider.execute(instruction);
                return { ...result, meta: { ...result.meta, traceId, trackId } };
            }
            throw new Error(`[Kernel] 轨道定义不存在或未配置流: ${trackId}`);
        }
        catch (error) {
            return { success: false, error: error.message || String(error), meta: { traceId } };
        }
    }
    getEmbedder(agentId = 'embedder') { return this.aiHub.getEmbedder(agentId); }
    getCompleter(agentId = 'summarizer') { return this.aiHub.getCompleter(agentId); }
    getCAS() { return this.cas; }
    getVectorStorage() { return this.vectorStorage; }
    getConfig() { return this.config; }
    getToolRegistry() { return this.toolRegistry; }
    async listTools() { return this.toolRegistry.list().map(t => t.manifest); }
    async listTracks() { return Array.from(this.tracks.values()); }
    clearCache() { this.cache.clear(); this.sessionCache.clear(); }
    setComponents(components) {
        this.cas = components.cas;
        this.vectorStorage = components.vector;
        this.hostResources.flesh = components.cas;
        this.hostResources.soul = components.vector;
        this.hostResources.ai.getEmbedder = () => components.embedder;
        if (components.completer) {
            this.hostResources.ai.getCompleter = () => components.completer;
        }
    }
}
//# sourceMappingURL=kernel.js.map