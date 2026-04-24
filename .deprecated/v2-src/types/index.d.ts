export interface MemoryConfig {
    embedding: EmbeddingConfig;
    /**
     * CAS（内容寻址存储）配置
     *
     * 说明：
     * - 用于“灵肉分离”：原文落盘到 CAS，索引仅保存引用（contentHash/contentRef）
     * - 该字段为可选，避免老配置文件缺失时导致启动失败
     */
    cas?: CasConfig;
    /**
     * 路由配置（可选）
     *
     * 说明：
     * - 用于“写入管”的智能路由阶段：根据 MemoContext 等信息决定写入到哪个轨道
     * - 该字段为可选，避免老配置文件缺失时导致启动失败
     */
    routing?: RoutingConfig;
    gbrain: GBrainConfig;
    clawmem: ClawMemConfig;
    search: SearchConfig;
    sync: SyncConfig;
    logging: LoggingConfig;
    mcp_server: MCPServerConfig;
}
/**
 * 路由规则配置：按 filePath 后缀命中
 */
export interface RoutingRuleConfigFileSuffix {
    type: "file_suffix";
    /**
     * 规则名称（用于观测与排查，可选）
     */
    name?: string;
    /**
     * 命中后写入的轨道（如：clawmem）
     */
    track: string;
    /**
     * 文件后缀列表（如：[".ts", ".py"]）
     */
    suffixes: string[];
}
/**
 * 路由规则配置：默认兜底（始终命中）
 */
export interface RoutingRuleConfigDefault {
    type: "default";
    /**
     * 规则名称（用于观测与排查，可选）
     */
    name?: string;
    /**
     * 默认写入的轨道（如：gbrain）
     */
    track: string;
}
export type RoutingRuleConfig = RoutingRuleConfigFileSuffix | RoutingRuleConfigDefault;
/**
 * 路由配置（用于写入管路由阶段）
 *
 * 优先级：
 * - 环境变量 > YAML 配置文件 > 默认值
 *
 * 兼容性说明：
 * - 若 routing 缺失，系统会采用内置默认规则：file_suffix → clawmem，否则 → gbrain
 */
export interface RoutingConfig {
    /**
     * 是否启用路由阶段（默认 true）
     */
    enabled: boolean;
    /**
     * 默认轨道（默认 gbrain）
     */
    default_track: string;
    /**
     * “代码后缀”列表（用于默认 file_suffix 规则）
     *
     * 说明：
     * - 该字段主要用于“简化配置”：不写 rules 时，系统会用它来构造默认 file_suffix 规则
     * - 当用户显式提供 rules 时，该字段不再生效（视为全量覆盖）
     */
    code_suffixes: string[];
    /**
     * 可选：用户自定义规则列表（责任链，按顺序执行）
     */
    rules?: RoutingRuleConfig[];
}
export interface CasConfig {
    /**
     * CAS 根目录（支持 ~ 展开）
     */
    root_path: string;
}
export interface EmbeddingConfig {
    url: string;
    model: string;
    dimensions: number;
    timeout: number;
}
export interface GBrainConfig {
    db_path: string;
    table_name: string;
    default_category: string;
    default_importance: number;
}
export interface ClawMemConfig {
    db_path: string;
    table_name: string;
    default_language: string;
    default_importance: number;
}
export interface SearchConfig {
    default_sources: string[];
    default_limit: number;
    parallel: boolean;
    cache_enabled: boolean;
    cache_path: string;
}
export interface SyncConfig {
    editor_memory_paths: string[];
    interval: number;
    cloud: CloudSyncConfig;
}
export interface CloudSyncConfig {
    enabled: boolean;
    provider: string;
    repo: string;
    branch: string;
}
export interface LoggingConfig {
    level: string;
    file: string;
    console: boolean;
}
export interface MCPServerConfig {
    enabled: boolean;
    port: number;
    transport: string;
    timeout: number;
}
export interface GBrainRecord {
    id: string;
    text: string;
    vector: number[];
    category: string;
    scope: string;
    importance: number;
    timestamp: string;
    tags: string[];
    source: string;
    access_count: number;
    last_accessed: string | null;
    entities: string[];
    hash: string;
    /**
     * 原文引用（CAS）
     *
     * 说明：
     * - 新写入会尽量补齐该字段；旧数据可能不存在，因此必须是可选
     */
    content_ref?: string;
    _distance?: number;
}
export interface ClawMemRecord {
    id: string;
    text: string;
    vector: number[];
    ast_type: string;
    symbol_name: string;
    parent_symbol: string | null;
    file_path: string;
    language: string;
    importance: number;
    timestamp: string;
    source: string;
    tags: string[];
    access_count: number;
    last_accessed: string | null;
    entities: string[];
    hash: string;
    /**
     * 原文引用（CAS）
     *
     * 说明：
     * - 新写入会尽量补齐该字段；旧数据可能不存在，因此必须是可选
     */
    content_ref?: string;
    _distance?: number;
}
export interface SearchResult {
    source: string;
    content: string;
    score: number;
    metadata: Record<string, any>;
    timestamp: string;
}
export declare enum SearchSource {
    GBrain = "gbrain",
    ClawMem = "clawmem",
    Ripgrep = "ripgrep",
    Git = "git",
    Session = "session"
}
export interface AddKnowledgeParams {
    text: string;
    category?: string;
    importance?: number;
    tags?: string[];
    /**
     * 预先计算好的实体数组（可选）
     *
     * 说明：
     * - 主要用于“管道写入”等上层在写库前做统一增强（比如实体抽取）
     * - 如果不传，存储层会使用默认策略从 text 里做轻量抽取（保证 CLI 直写也能得到 entities）
     * - 若希望显式关闭抽取，可传入空数组 `[]`
     */
    entities?: string[];
    /**
     * 原文引用（CAS）
     *
     * 说明：
     * - 外部一般不需要手动传；写入链路会自动生成
     * - 之所以保留该参数，是为了支持“索引重建”时从 CAS 回灌
     */
    content_ref?: string;
}
export interface AddCodeParams {
    text: string;
    language?: string;
    ast_type?: string;
    symbol_name?: string;
    file_path?: string;
    importance?: number;
    tags?: string[];
    /**
     * 原文引用（CAS）
     *
     * 说明：
     * - 外部一般不需要手动传；写入链路会自动生成
     * - 之所以保留该参数，是为了支持“索引重建”时从 CAS 回灌
     */
    content_ref?: string;
}
export interface SearchParams {
    query: string;
    limit?: number;
    category?: string;
    language?: string;
    ast_type?: string;
    sources?: string[];
}
/**
 * MemoHub 2.0+ 反应式管道模型核心类型
 *
 * 说明：
 * - 这些类型是“新引擎”的统一契约，用于在不同轨道（track）之间做统一写入/检索/治理编排。
 * - 现有对外行为（CLI/MCP 的入参出参）暂时不依赖这些类型；它们是逐步演进的基础设施。
 */
/**
 * MemoContext：富上下文透传载体
 *
 * 设计目标：
 * - 让写入/检索在不改变主业务结构的前提下，携带可选上下文用于路由、脱敏、审计、回放等。
 * - 允许扩展字段（例如 agentTrace、branch、commitHash），因此用索引签名兜底。
 */
export interface MemoContext {
    sessionId?: string;
    project?: string;
    filePath?: string;
    source?: string;
    [key: string]: unknown;
}
/**
 * MemoRecord：统一索引契约（写入/检索结果的公共结构）
 *
 * 说明：
 * - contentHash/contentRef 用于“灵肉分离（CAS + 索引引用）”，本期仅定义字段，写入/回填在后续任务落地。
 * - metadata 保持可扩展，避免在早期把字段锁死，便于按轨道演进。
 */
export interface MemoRecord {
    id?: string;
    track: string;
    text: string;
    contentHash?: string;
    contentRef?: string;
    entities?: string[];
    metadata?: Record<string, unknown>;
    score?: number;
}
/**
 * TrackProvider：轨道提供者（以适配器方式接入现有实现）
 *
 * 设计目标：
 * - 核心引擎不内置 GBrain/ClawMem 业务逻辑，只依赖 Provider 插件接口。
 * - Provider 负责把“轨道的真实存储模型”映射到 MemoRecord 契约。
 */
export interface TrackProvider {
    track: string;
    initialize?: () => Promise<void>;
    ingest: (request: MemoIngestRequest) => Promise<MemoRecord>;
    retrieve: (request: MemoRetrieveRequest) => Promise<MemoRecord[]>;
    /**
     * 可选：FTS（全文检索）召回
     *
     * 设计目标：
     * - 保持 Vector 召回为必选能力（retrieve 必须存在）
     * - FTS 作为“可插拔插槽”逐步接入：依赖/索引不可用时返回空数组即可，不影响主流程
     *
     * 兼容性说明：
     * - 该字段为可选，不会破坏现有 Provider 实现
     */
    retrieveFTS?: (request: MemoRetrieveRequest) => Promise<MemoRecord[]>;
}
/**
 * PipelineStage：管道阶段（可插拔、可观测）
 *
 * 说明：
 * - 每个阶段只关注“输入 → 输出”的纯转换，副作用（如写库）同样通过阶段实现，但统一被事件流观测。
 * - context 作为只读上下文透传，阶段可选择性裁剪/脱敏后再写入元数据（后续任务实现）。
 */
export interface PipelineStage<TInput, TOutput> {
    name: string;
    run: (input: TInput, context?: MemoContext) => Promise<TOutput>;
}
/**
 * 写入管（Ingestion）统一入参
 *
 * 注意：本期先保证“能跑通 Provider 适配器 + 事件流”，路由/CAS/实体等增强在后续任务逐步接入。
 */
export interface MemoIngestRequest {
    text: string;
    track?: string;
    context?: MemoContext;
    metadata?: Record<string, unknown>;
}
/**
 * 检索管（Retrieval）统一入参
 */
export interface MemoRetrieveRequest {
    query: string;
    /**
     * 兼容字段：旧版调用方可能通过 tracks 指定检索轨道。
     *
     * 新版推荐用 filters.track / filters.tracks 统一表达“轨道过滤”，以减少顶层参数膨胀。
     */
    tracks?: string[];
    limit?: number;
    filters?: Record<string, unknown>;
    context?: MemoContext;
    /**
     * FTS 召回开关（可选插槽）
     *
     * 约定：
     * - enabled=true：在 Provider 支持且底层依赖可用时启用；否则自动退化为关闭
     * - enabled=false：显式关闭（无论依赖是否可用）
     * - undefined：按系统默认策略决定（兼容性优先：默认不强制开启，以免改变旧行为）
     */
    fts?: {
        enabled?: boolean;
    };
    /**
     * 是否回填原文（Hydration）
     *
     * 兼容性说明：
     * - 默认不显式传入时，系统会保持现有行为（因为索引里仍有 text）
     * - 当未来写入侧不再存 text 时，该开关决定是否从 CAS 读取原文
     */
    hydrate?: boolean;
}
/**
 * 治理管（Governance）统一入参/出参（骨架）
 */
export interface MemoGovernanceRequest {
    records: MemoRecord[];
    context?: MemoContext;
}
/**
 * 冲突检测策略
 *
 * 说明：
 * - jaccard：对文本做轻量 token 化后，用集合 Jaccard 相似度判定
 * - contains：基于“互相包含”的字符串规则做判定（适合短句/标题类语料）
 */
export type ConflictDetectionStrategy = "jaccard" | "contains";
/**
 * 最小冲突检测配置（可选）
 *
 * 设计目标：
 * - 先把“阈值/策略”配置化，保证后续可以演进而不破坏对外契约
 * - 本期默认通过治理管构造参数或环境变量注入配置，避免强耦合配置文件结构
 */
export interface ConflictDetectionConfig {
    /**
     * 是否启用冲突检测（默认 true）
     */
    enabled: boolean;
    /**
     * 冲突阈值（0~1，默认 0.9）
     */
    threshold: number;
    /**
     * 检测策略（默认 jaccard）
     */
    strategy: ConflictDetectionStrategy;
    /**
     * 仅当 anchor 文本长度 >= 该值时才做检测（默认 12）
     */
    min_text_length: number;
    /**
     * 最多返回多少个候选冲突（默认 5）
     */
    max_candidates: number;
    /**
     * 持久化队列路径（NDJSON，一行一个事件）
     */
    queue_path: string;
}
/**
 * 冲突候选项：用于解释“为什么认为它冲突”
 */
export interface MemoConflictCandidate {
    /**
     * 候选记录（来自检索/已有记忆）
     */
    record: MemoRecord;
    /**
     * 相似度分数（0~1）
     */
    score: number;
    /**
     * 命中原因（可读文本，便于人类裁决）
     */
    reason: string;
}
/**
 * 冲突事件：等待裁决（最小闭环）
 *
 * 说明：
 * - anchor：触发冲突检测的“锚点记录”（通常是本次准备写入的新内容）
 * - candidates：可能与之冲突的候选记录（通常来自检索/已有库）
 */
export interface MemoConflictPendingEvent {
    name: "CONFLICT_PENDING";
    id: string;
    timestamp: string;
    anchor: MemoRecord;
    candidates: MemoConflictCandidate[];
    threshold: number;
    strategy: ConflictDetectionStrategy;
    context?: MemoContext;
}
/**
 * 冲突裁决动作（最小集合）
 *
 * 说明：
 * - accept_anchor：保留锚点文本作为最终版本（回流写入 anchor）
 * - accept_candidate：选择某个候选记录作为最终版本（回流写入候选）
 * - merge：由人类/Agent 提供一段合并后的 finalText（回流写入 finalText）
 * - reject_all：本次不写入（仅记录裁决，不回流写入）
 */
export type MemoConflictResolutionAction = "accept_anchor" | "accept_candidate" | "merge" | "reject_all";
/**
 * 冲突裁决请求：用于回流写入闭环
 */
export interface MemoConflictResolution {
    conflict_id: string;
    action: MemoConflictResolutionAction;
    /**
     * 当 action=accept_candidate 时，用于指定选择的候选 record.id（可选）
     */
    selected_candidate_id?: string;
    /**
     * 当 action=merge 时必须提供（合并后的最终文本）
     */
    final_text?: string;
    /**
     * 可选：强制写入到指定 track；不传则尽量沿用锚点 track
     */
    track?: string;
    /**
     * 可选：透传上下文（会进入写入管）
     */
    context?: MemoContext;
    /**
     * 可选：额外元信息（会进入写入管 metadata）
     */
    metadata?: Record<string, unknown>;
}
export interface MemoGovernanceResult {
    conflicts: MemoConflictPendingEvent[];
}
//# sourceMappingURL=index.d.ts.map