export interface MemoryConfig {
    embedding: EmbeddingConfig;
    gbrain: GBrainConfig;
    clawmem: ClawMemConfig;
    search: SearchConfig;
    sync: SyncConfig;
    logging: LoggingConfig;
    mcp_server: MCPServerConfig;
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
}
export interface AddCodeParams {
    text: string;
    language?: string;
    ast_type?: string;
    symbol_name?: string;
    file_path?: string;
    importance?: number;
    tags?: string[];
}
export interface SearchParams {
    query: string;
    limit?: number;
    category?: string;
    language?: string;
    ast_type?: string;
    sources?: string[];
}
//# sourceMappingURL=index.d.ts.map