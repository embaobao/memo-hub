export interface VectorRecord {
  id: string;
  vector: number[];
  hash: string;
  track_id: string;
  entities: string[];
  // 通用字段
  timestamp: string;
  access_count?: number;
  last_accessed?: string;
  // track-insight 专用字段
  category?: string;
  importance?: number;
  tags?: string[];
  source?: string;
  // 统一记忆模型投影字段
  memory_id?: string;
  content_index?: number;
  scope_types?: string[];
  scope_ids?: string[];
  visibility?: string;
  domain_types?: string[];
  state?: string;
  source_type?: string;
  source_id?: string;
  channel?: string;
  actor_id?: string;
  subject_id?: string;
  text?: string;
  operation_type?: string;
  clarification_id?: string;
  review_state?: string;
  // track-source 专用字段
  language?: string;
  ast_type?: string;
  symbol_name?: string;
  parent_symbol?: string | null;
  file_path?: string;
  // 其他元数据
  [key: string]: any;
}

export interface SearchOptions {
  limit?: number;
  filter?: string;
}

export interface VectorStorageConfig {
  dbPath: string;
  tableName: string;
  dimensions: number;
}
