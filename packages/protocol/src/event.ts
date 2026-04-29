/**
 * Event Protocol Definition
 *
 * 定义外部系统与 MemoHub Integration Hub 之间的事件协议
 */

/**
 * 事件源类型
 */
export enum EventSource {
  HERMES = "hermes",
  IDE = "ide",
  CLI = "cli",
  MCP = "mcp",
  EXTERNAL = "external"
}

/**
 * 事件类型（MVP 只支持 memory）
 */
export enum EventKind {
  MEMORY = "memory",
  // 未来扩展：
  // REPO_ANALYSIS = "repo_analysis",
  // API_CAPABILITY = "api_capability",
  // SESSION_STATE = "session_state",
  // BUSINESS_CONTEXT = "business_context",
  // HABIT = "habit"
}

/**
 * 置信度级别
 */
export enum EventConfidence {
  REPORTED = "reported",     // 明确提供
  OBSERVED = "observed",     // 观察得到
  INFERRED = "inferred",     // 推断生成
  PROVISIONAL = "provisional", // 临时性
  VERIFIED = "verified"      // 已验证
}

/**
 * 记忆事件负载
 */
export interface MemoryEventPayload {
  text: string;
  kind?: "memory";
  file_path?: string;
  category?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * 通用事件负载（未来扩展）
 */
export interface RepoAnalysisPayload {
  repo: string;
  analysis: unknown;
}

export interface ApiCapabilityPayload {
  api: string;
  capability: unknown;
}

export interface SessionStatePayload {
  sessionId: string;
  state: unknown;
}

export interface BusinessContextPayload {
  context: string;
  details: unknown;
}

export interface HabitPayload {
  habit: string;
  pattern: unknown;
}

/**
 * 事件负载联合类型
 */
export type EventPayload =
  | MemoryEventPayload
  | RepoAnalysisPayload
  | ApiCapabilityPayload
  | SessionStatePayload
  | BusinessContextPayload
  | HabitPayload;

/**
 * MemoHub 事件包
 *
 * 外部系统发送给 Integration Hub 的标准事件格式
 */
export interface MemoHubEvent {
  /**
   * 可选：客户端提供的事件 ID
   * 如果未提供，Integration Hub 将自动生成
   */
  id?: string;

  /**
   * 事件源
   */
  source: EventSource;

  /**
   * 频道标识（如 "hermes-memory-center"）
   */
  channel: string;

  /**
   * 事件类型
   */
  kind: EventKind;

  /**
   * 项目 ID
   */
  projectId: string;

  /**
   * 可选：会话 ID
   */
  sessionId?: string;

  /**
   * 可选：任务 ID
   */
  taskId?: string;

  /**
   * 可选：仓库信息
   */
  repo?: string;

  /**
   * 可选：实体引用
   */
  entityRefs?: Array<{
    type: string;
    id: string;
    name?: string;
  }>;

  /**
   * 置信度级别
   */
  confidence: EventConfidence;

  /**
   * 可选：发生时间（ISO 8601）
   * 如果未提供，Integration Hub 将使用当前时间
   */
  occurredAt?: string;

  /**
   * 事件负载
   */
  payload: EventPayload;
}

/**
 * 验证 MemoHubEvent 的基本规则
 */
export interface EventValidationRule {
  field: keyof MemoHubEvent;
  required: boolean;
  type?: string;
  enum?: string[];
}

/**
 * 事件验证规则
 */
export const EVENT_VALIDATION_RULES: EventValidationRule[] = [
  { field: "source", required: true, enum: Object.values(EventSource) },
  { field: "channel", required: true, type: "string" },
  { field: "kind", required: true, enum: Object.values(EventKind) },
  { field: "projectId", required: true, type: "string" },
  { field: "confidence", required: true, enum: Object.values(EventConfidence) },
  { field: "payload", required: true, type: "object" }
];

/**
 * 验证 MemoHubEvent 的基本规则（不使用 zod）
 */
export function validateMemoHubEventBasic(event: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!event || typeof event !== "object") {
    return { valid: false, errors: ["Event must be an object"] };
  }

  const e = event as Partial<MemoHubEvent>;

  // 验证必需字段
  if (!e.source) {
    errors.push("Missing required field: source");
  } else if (!Object.values(EventSource).includes(e.source as EventSource)) {
    errors.push(`Invalid source: ${e.source}. Must be one of: ${Object.values(EventSource).join(", ")}`);
  }

  if (!e.channel) {
    errors.push("Missing required field: channel");
  }

  if (!e.kind) {
    errors.push("Missing required field: kind");
  } else if (!Object.values(EventKind).includes(e.kind as EventKind)) {
    errors.push(`Invalid kind: ${e.kind}. Must be one of: ${Object.values(EventKind).join(", ")}`);
  }

  if (!e.projectId) {
    errors.push("Missing required field: projectId");
  }

  if (!e.confidence) {
    errors.push("Missing required field: confidence");
  } else if (!Object.values(EventConfidence).includes(e.confidence as EventConfidence)) {
    errors.push(`Invalid confidence: ${e.confidence}. Must be one of: ${Object.values(EventConfidence).join(", ")}`);
  }

  if (!e.payload) {
    errors.push("Missing required field: payload");
  } else if (typeof e.payload !== "object") {
    errors.push("Payload must be an object");
  } else if (e.kind === EventKind.MEMORY) {
    // 对于 memory 类型，验证 payload.text
    const memoryPayload = e.payload as Partial<MemoryEventPayload>;
    if (!memoryPayload.text || typeof memoryPayload.text !== "string") {
      errors.push("Memory event payload must have a 'text' field of type string");
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
