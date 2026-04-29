import {
  AgentMemoryOperator,
  type QueryRequest,
} from "@memohub/core";
import {
  EventConfidence,
  EventKind,
  EventSource,
  type MemoryObject,
  type MemoHubEvent,
} from "@memohub/protocol";
import type { UnifiedMemoryRuntime } from "./unified-memory-runtime.js";

export interface MemoryIngestRequest {
  text: string;
  source?: EventSource;
  channel?: string;
  projectId?: string;
  confidence?: EventConfidence;
  sessionId?: string;
  taskId?: string;
  filePath?: string;
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface ViewQueryRequest extends QueryRequest {
  source?: EventSource;
}

export interface AgentOperationCliRequest {
  type: "summarize" | "clarify";
  text: string;
  sourceAgentId?: string;
  projectId?: string;
}

type IntegrationHubLike = {
  ingest(event: MemoHubEvent): Promise<unknown>;
};

const DEFAULT_PROJECT_ID = "default";
const DEFAULT_CHANNEL_BY_SOURCE: Record<EventSource, string> = {
  [EventSource.HERMES]: "hermes-session",
  [EventSource.IDE]: "ide-session",
  [EventSource.CLI]: "cli-command",
  [EventSource.MCP]: "mcp-tool",
  [EventSource.EXTERNAL]: "external-event",
};

/**
 * 构造统一的 memory 事件，供 CLI 和 MCP 复用。
 */
export function buildMemoryEvent(request: MemoryIngestRequest): MemoHubEvent {
  const source = request.source ?? EventSource.CLI;

  return {
    source,
    channel: request.channel ?? DEFAULT_CHANNEL_BY_SOURCE[source],
    kind: EventKind.MEMORY,
    projectId: request.projectId ?? DEFAULT_PROJECT_ID,
    confidence: request.confidence ?? EventConfidence.REPORTED,
    ...(request.sessionId ? { sessionId: request.sessionId } : {}),
    ...(request.taskId ? { taskId: request.taskId } : {}),
    payload: {
      text: request.text,
      kind: EventKind.MEMORY,
      ...(request.filePath ? { file_path: request.filePath } : {}),
      ...(request.category ? { category: request.category } : {}),
      metadata: request.metadata ?? {},
    },
  };
}

/**
 * 统一通过 IntegrationHub 写入，避免 CLI 和 MCP 出现行为漂移。
 */
export async function ingestMemory(
  integrationHub: IntegrationHubLike,
  request: MemoryIngestRequest,
) {
  return integrationHub.ingest(buildMemoryEvent(request));
}

export async function queryMemoryView(runtime: UnifiedMemoryRuntime, request: ViewQueryRequest) {
  return runtime.queryView(request);
}

export async function runAgentOperation(request: AgentOperationCliRequest) {
  const now = new Date().toISOString();
  const input: MemoryObject = {
    id: `mem_cli_${hashText(request.text)}`,
    kind: "evidence",
    source: { type: "cli", id: "cli" },
    actor: { type: "agent", id: request.sourceAgentId ?? "cli" },
    scopes: [{ type: "project", id: request.projectId ?? DEFAULT_PROJECT_ID }],
    visibility: "private",
    domains: [{ type: request.type === "summarize" ? "task-session" : "project-knowledge" }],
    state: request.type === "clarify" ? "conflicted" : "raw",
    content: [{ type: "text", text: request.text }],
    provenance: { ingestedAt: now },
    createdAt: now,
    updatedAt: now,
  };

  return new AgentMemoryOperator().run({
    type: request.type,
    inputMemories: [input],
    sourceAgent: { type: "agent", id: request.sourceAgentId ?? "cli" },
    now,
  });
}

function hashText(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16);
}
