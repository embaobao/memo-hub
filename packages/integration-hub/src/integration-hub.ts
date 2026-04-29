/**
 * Integration Hub
 *
 * 接受外部事件，验证、去重，并投影到 Text2Mem 指令
 */

import { randomUUID } from "node:crypto";
import { MemoHubEvent, validateMemoHubEventBasic } from "@memohub/protocol";
import { IntegrationHubError } from "@memohub/protocol";
import { ContentAddressableStorage } from "@memohub/storage-flesh";
import { MemoryKernel } from "@memohub/core";
import { PerformanceMonitor, globalPerformanceMonitor } from "@memohub/core";
import { CASAdapter } from "./cas-adapter.js";
import { EventProjector } from "./projector.js";
import { normalizeMemoHubEvent, NormalizedMemory } from "./normalizer.js";

export interface IngestResult {
  success: boolean;
  eventId: string;
  contentHash?: string;
  instruction?: any;
  canonicalEvent?: NormalizedMemory["canonicalEvent"];
  memoryObject?: NormalizedMemory["memoryObject"];
  error?: string;
}

export interface IntegrationHubConfig {
  cas: ContentAddressableStorage;
  kernel: MemoryKernel;
  performance?: PerformanceMonitor;
}

/**
 * Integration Hub
 *
 * 外部系统与 MemoHub 之间的桥梁
 */
export class IntegrationHub {
  private casAdapter: CASAdapter;
  private projector: EventProjector;
  private kernel: MemoryKernel;
  private performance: PerformanceMonitor;

  constructor(config: IntegrationHubConfig) {
    this.kernel = config.kernel;
    this.performance = config.performance || globalPerformanceMonitor;

    // 初始化 CAS 适配器
    this.casAdapter = new CASAdapter(config.cas, this.performance);

    // 初始化投影器
    this.projector = new EventProjector();
  }

  /**
   * 摄取外部事件
   *
   * 主要入口点，接受外部事件并处理
   */
  async ingest(event: MemoHubEvent): Promise<IngestResult> {
    const endTiming = this.performance.startOperation(
      "integration_hub_ingest",
      event.id || "unknown",
      { kind: event.kind, source: event.source }
    );

    try {
      // 1. 验证事件
      const validation = validateMemoHubEventBasic(event);
      if (!validation.valid) {
        throw IntegrationHubError.invalidEvent(validation.errors);
      }

      // 2. 生成事件 ID（如果未提供）
      const eventId = event.id || this.generateEventId();

      // 3. 添加时间戳（如果未提供）
      const occurredAt = event.occurredAt || new Date().toISOString();

      // 4. 提取内容并计算哈希
      const content = this.extractContent(event);
      const casResult = await this.casAdapter.writeContent(content);

      // 5. 投影到 Text2Mem 指令
      const enrichedEvent = {
        ...event,
        id: eventId,
        occurredAt
      };

      const normalized = normalizeMemoHubEvent(enrichedEvent, {
        eventId,
        receivedAt: occurredAt,
        contentHash: casResult.hash,
      });

      const instruction = await this.projector.projectEvent(
        enrichedEvent,
        casResult.hash
      );

      // 6. 添加元数据
      instruction.meta = {
        ...instruction.meta,
        eventId,
        contentHash: casResult.hash,
        timestamp: occurredAt
      };

      // 7. 通过 MemoryKernel 分发
      const result = await this.kernel.dispatch(instruction);

      endTiming();

      return {
        success: result.success,
        eventId,
        contentHash: casResult.hash,
        canonicalEvent: normalized.canonicalEvent,
        memoryObject: normalized.memoryObject,
        instruction: result,
        error: result.error?.message
      };

    } catch (error) {
      endTiming();

      if (error instanceof IntegrationHubError) {
        return {
          success: false,
          eventId: event.id || this.generateEventId(),
          error: error.message
        };
      }

      // 处理未知错误
      return {
        success: false,
        eventId: event.id || this.generateEventId(),
        error: `Internal error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 批量摄取事件
   */
  async ingestBatch(events: MemoHubEvent[]): Promise<IngestResult[]> {
    const results: IngestResult[] = [];

    // 并行处理以提高性能
    const promises = events.map(event => this.ingest(event));
    const settled = await Promise.all(promises);

    return settled;
  }

  /**
   * 生成唯一事件 ID
   */
  private generateEventId(): string {
    return `evt_${randomUUID()}`;
  }

  /**
   * 从事件中提取主要内容
   */
  private extractContent(event: MemoHubEvent): string {
    switch (event.kind) {
      case "memory":
        return (event.payload as any).text || "";

      // 未来扩展：
      // case "repo_analysis":
      //   return JSON.stringify(event.payload);
      // case "api_capability":
      //   return JSON.stringify(event.payload);
      // etc.

      default:
        return "";
    }
  }

  /**
   * 获取性能监控实例
   */
  getPerformance(): PerformanceMonitor {
    return this.performance;
  }
}
