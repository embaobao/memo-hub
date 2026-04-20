// 类型定义

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

// GBrain 记录类型
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
  entities: string[]; // 实体纽带（用于多轨交叉检索）
  hash: string; // 内容哈希（用于去重）
  _distance?: number; // LanceDB 返回的距离
}

// ClawMem 记录类型
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
  entities: string[]; // 实体纽带（接口/函数名等）
  hash: string; // 内容哈希（用于去重）
  _distance?: number; // LanceDB 返回的距离
}

// 搜索结果类型
export interface SearchResult {
  source: string;
  content: string;
  score: number;
  metadata: Record<string, any>;
  timestamp: string;
}

// 搜索源枚举
export enum SearchSource {
  GBrain = "gbrain",
  ClawMem = "clawmem",
  Ripgrep = "ripgrep",
  Git = "git",
  Session = "session",
}

// 添加知识参数
export interface AddKnowledgeParams {
  text: string;
  category?: string;
  importance?: number;
  tags?: string[];
}

// 添加代码参数
export interface AddCodeParams {
  text: string;
  language?: string;
  ast_type?: string;
  symbol_name?: string;
  file_path?: string;
  importance?: number;
  tags?: string[];
}

// 搜索参数
export interface SearchParams {
  query: string;
  limit?: number;
  category?: string;
  language?: string;
  ast_type?: string;
  sources?: string[];
}
