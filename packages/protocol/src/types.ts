/**
 * Text2Mem 协议核心类型定义 (v1.1.0)
 * 职责: 定义指令集、操作码、错误码及指令流生命周期状态。
 */

export enum MemoOp {
  ADD = "ADD",
  RETRIEVE = "RETRIEVE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  LIST = "LIST",
  SYNC = "SYNC",
  EXPORT = "EXPORT",
  ANCHOR = "ANCHOR",
  MERGE = "MERGE",
  DISTILL = "DISTILL",
  DIFF = "DIFF",
  CLARIFY = "CLARIFY",
}

export enum MemoErrorCode {
  ERR_SYSTEM_BOOT = "ERR_SYSTEM_BOOT",
  ERR_CONFIG_INVALID = "ERR_CONFIG_INVALID",
  ERR_KERNEL_OFFLINE = "ERR_KERNEL_OFFLINE",
  ERR_TRACK_NOT_FOUND = "ERR_TRACK_NOT_FOUND",
  ERR_TOOL_NOT_FOUND = "ERR_TOOL_NOT_FOUND",
  ERR_CAS_WRITE_FAILED = "ERR_CAS_WRITE_FAILED",
  ERR_VECTOR_SEARCH_FAILED = "ERR_VECTOR_SEARCH_FAILED",
  ERR_AI_TIMEOUT = "ERR_AI_TIMEOUT",
}

export enum InstructionState {
  RECEIVED = "RECEIVED",
  PARSED = "PARSED",
  HASHED = "HASHED",
  INDEXED = "INDEXED",
  COMMITTED = "COMMITTED",
  FAILED = "FAILED",
}

/**
 * @internal
 */
export interface Text2MemInstruction {
  op: MemoOp;
  trackId: string;
  payload: any;
  context?: {
    source?: string;
    sessionId?: string;
    [key: string]: any;
  };
  meta?: {
    traceId: string;
    timestamp: string;
    state?: InstructionState;
  };
}

/**
 * @internal
 */
export interface Text2MemResult {
  success: boolean;
  data?: any;
  error?: {
    code: MemoErrorCode;
    message: string;
  };
  meta?: {
    traceId: string;
    trackId: string;
    state: InstructionState;
    latencyMs: number;
  };
}

export interface IToolManifest {
  id: string;
  type: 'builtin' | 'extension';
  description?: string;
}

export interface ITool {
  manifest: IToolManifest;
  execute(input: any, resources: any, context: any): Promise<any>;
}

/**
 * @internal
 */
export interface IKernel {
  getCAS(): ICAS;
  getVectorStorage(): IVectorStorage;
  getEmbedder(): IEmbedder;
  getCompleter(): ICompleter | null;
  getTool(id: string): ITool;
  getResources(): any;
  dispatch(instruction: Text2MemInstruction): Promise<Text2MemResult>;
}

/**
 * @internal
 */
export interface ITrackProvider {
  id: string;
  name: string;
  initialize(kernel: IKernel): Promise<void>;
  execute(instruction: Text2MemInstruction): Promise<Text2MemResult>;
}

export interface ICAS {
  write(content: string): Promise<string>;
  read(hash: string): Promise<string>;
}

export interface IVectorStorage {
  initialize(): Promise<void>;
  add(record: any | any[]): Promise<void>;
  search(vector: number[], options?: { limit?: number; filter?: string }): Promise<any[]>;
  delete(filter: string): Promise<void>;
  list(filter?: string, limit?: number): Promise<any[]>;
  update(id: string, changes: any): Promise<void>;
}

export interface IEmbedder {
  embed(text: string): Promise<number[]>;
}

export interface ICompleter {
  chat(messages: Array<{ role: string; content: string }>): Promise<string>;
  summarize(text: string): Promise<string>;
}
