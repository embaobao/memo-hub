import { z } from "zod";
import { MemoHubEvent } from "@memohub/protocol";

/**
 * memohub_ingest_event MCP 工具
 *
 * 功能：摄取外部事件到 MemoHub Integration Hub
 * 位置：apps/cli/src/mcp/tools/ingest.ts
 */

/**
 * 工具输入 Schema
 */
export const IngestEventInputSchema = z.object({
  event: z.object({
    source: z.string().describe("事件来源 (hermes, ide, cli, mcp, external)"),
    channel: z.string().describe("事件通道 (用户定义)"),
    kind: z.enum(["memory"]).describe("事件类型 (目前仅支持 memory)"),
    projectId: z.string().describe("项目标识符"),
    confidence: z.enum(["reported", "observed", "inferred", "provisional", "verified"]).describe("置信度级别"),
    payload: z.object({
      text: z.string().describe("文本内容"),
      kind: z.enum(["memory"]).optional().describe("Payload kind (用于路由)"),
      file_path: z.string().optional().describe("文件路径 (可选)"),
      category: z.string().optional().describe("分类 (可选)"),
      tags: z.array(z.string()).optional().describe("标签 (可选)"),
      metadata: z.record(z.any()).optional().describe("来源元数据 (可选)")
    }).describe("事件负载数据")
  }).describe("MemoHubEvent 对象")
});

export type IngestEventInput = z.infer<typeof IngestEventInputSchema>;

type IngestRuntimeLike = {
  ingest(event: MemoHubEvent): Promise<{
    success: boolean;
    eventId: string;
    contentHash?: string;
    canonicalEvent?: unknown;
    memoryObject?: unknown;
    instruction?: unknown;
    error?: string;
  }>;
};

/**
 * 创建 memohub_ingest_event 工具处理器。
 *
 * 这里使用开放 source descriptor，确保 gemini、scanner、browser extension
 * 等新来源接入时不需要改协议枚举。
 */
export function createIngestEventHandler(integrationHub: IngestRuntimeLike) {
  return async (params: IngestEventInput) => {
    try {
      // 1. 验证输入
      const validationResult = IngestEventInputSchema.safeParse(params);
      if (!validationResult.success) {
        return {
          success: false,
          error: "Invalid input schema",
          details: validationResult.error.errors
        };
      }

      const { event } = validationResult.data;

      // 2. 构造完整事件对象，统一交给运行时归一化为 CanonicalMemoryEvent/MemoryObject。
      const fullEvent: MemoHubEvent = {
        id: crypto.randomUUID(),
        occurredAt: new Date().toISOString(),
        source: event.source as any,
        channel: event.channel,
        kind: event.kind as any,
        projectId: event.projectId,
        confidence: event.confidence as any,
        payload: event.payload
      };

      // 3. 调用统一 ingest 入口。CLI/MCP 不关心后续存储投影细节。
      const ingestResult = await integrationHub.ingest(fullEvent);

      // 4. 检查摄取结果，并把 canonical event/object 返回给调用方用于审计。
      if (!ingestResult.success) {
        return {
          success: false,
          error: ingestResult.error || "Ingest failed",
          eventId: ingestResult.eventId
        };
      }

      return {
        success: true,
        eventId: ingestResult.eventId,
        contentHash: ingestResult.contentHash,
        canonicalEvent: ingestResult.canonicalEvent,
        memoryObject: ingestResult.memoryObject,
        instruction: ingestResult.instruction,
        contentLength: (fullEvent.payload as any).text?.length || 0
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined
      };
    }
  };
}

/**
 * 工具元数据
 */
export const INGEST_TOOL_METADATA = {
  name: "memohub_ingest_event",
  description: "摄取外部事件到 MemoHub Integration Hub",
  inputSchema: {
    type: "object" as const,
    properties: {
      event: {
        type: "object" as const,
        description: "MemoHubEvent 对象",
        properties: {
          source: {
            type: "string" as const,
            enum: ["hermes", "ide", "cli", "mcp", "external"],
            description: "事件来源"
          },
          channel: {
            type: "string" as const,
            description: "事件通道"
          },
          kind: {
            type: "string" as const,
            enum: ["memory"],
            description: "事件类型"
          },
          projectId: {
            type: "string" as const,
            description: "项目标识符"
          },
          confidence: {
            type: "string" as const,
            enum: ["reported", "observed", "inferred", "provisional", "verified"],
            description: "置信度级别"
          },
          payload: {
            type: "object" as const,
            description: "事件负载数据",
            properties: {
              text: {
                type: "string" as const,
                description: "文本内容"
              },
              kind: {
                type: "string" as const,
                enum: ["memory"],
                description: "Payload kind (用于路由)"
              },
              file_path: {
                type: "string" as const,
                description: "文件路径"
              },
              category: {
                type: "string" as const,
                description: "分类"
              },
              tags: {
                type: "array" as const,
                items: { type: "string" as const },
                description: "标签"
              },
              metadata: {
                type: "object" as const,
                description: "来源元数据"
              }
            },
            required: ["text"]
          }
        },
        required: ["source", "channel", "kind", "projectId", "confidence", "payload"]
      }
    },
    required: ["event"]
  }
};
