import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

/**
 * 持久化事件信封（NDJSON 单行写入）
 *
 * 设计目标：
 * - 事件写入“本地文件队列”，便于后续 Agent/后台任务用 tail/订阅方式消费
 * - 采用 NDJSON：一行一个 JSON 对象，天然支持追加写入与流式读取
 */
export interface PersistedEventEnvelope<TPayload> {
  id: string;
  type: string;
  timestamp: string;
  payload: TPayload;
}

export interface GovernanceEventQueue {
  append<TPayload>(event: PersistedEventEnvelope<TPayload>): Promise<void>;
  getPath(): string;
}

/**
 * FileGovernanceEventQueue：最小可用的“本地文件队列”
 *
 * 说明：
 * - 该实现只负责“追加写”，不负责消费/ACK（后续可演进为真正队列）
 * - 为了兼容现有系统：写入失败不会在治理阶段抛错（由调用方决定是否吞错）
 */
export class FileGovernanceEventQueue implements GovernanceEventQueue {
  private filePath: string;
  private ensureReadyPromise: Promise<void> | null = null;

  constructor(options: { filePath: string }) {
    const { filePath = "" } = options ?? {};
    this.filePath = expandHomePath(filePath);
  }

  getPath(): string {
    return this.filePath;
  }

  async append<TPayload>(event: PersistedEventEnvelope<TPayload>): Promise<void> {
    await this.ensureReady();
    const line = `${JSON.stringify(event)}\n`;
    await fs.appendFile(this.filePath, line, "utf-8");
  }

  private async ensureReady(): Promise<void> {
    if (this.ensureReadyPromise) {
      return this.ensureReadyPromise;
    }

    this.ensureReadyPromise = (async () => {
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });
      try {
        await fs.access(this.filePath);
      } catch {
        await fs.writeFile(this.filePath, "", "utf-8");
      }
    })();

    return this.ensureReadyPromise;
  }
}

function expandHomePath(inputPath: string): string {
  const raw = String(inputPath ?? "").trim();
  if (!raw) {
    return raw;
  }
  if (raw === "~") {
    return os.homedir();
  }
  if (raw.startsWith("~/")) {
    return path.join(os.homedir(), raw.slice(2));
  }
  return raw;
}

