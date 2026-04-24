import * as fs from "node:fs/promises";
import * as path from "node:path";

/**
 * FileIdempotencyStore：基于“追加写入 NDJSON”的幂等键存储
 *
 * 设计动机：
 * - Git Hook / 后台任务属于“自动化采集”，非常容易被重复触发（rebase、cherry-pick、重复运行命令等）。
 * - 这里用一个非常轻量的“幂等键”机制来保证：
 *   1) 同一份内容（由内容哈希或稳定 key 表达）只会写入一次；
 *   2) 写入失败不影响主流程（自动化采集是增强能力，兼容性优先）。
 *
 * 取舍：
 * - 采用 NDJSON（每行一个 JSON）而非整体 JSON：
 *   - 追加写安全、简单、并发冲突风险更低；
 *   - 读取时容错更强：某一行损坏不会导致整文件不可用。
 */
export class FileIdempotencyStore {
  private readonly filePath: string;
  private loaded = false;
  private keys = new Set<string>();

  constructor(options: { filePath: string }) {
    const { filePath } = options ?? { filePath: "" };
    this.filePath = filePath;
  }

  /**
   * 判断 key 是否已处理
   *
   * 注意：
   * - 第一次调用会懒加载读取文件并缓存到内存 Set 中
   * - key 为空时直接视为“未处理”，由上层决定是否跳过
   */
  async has(key: string): Promise<boolean> {
    const normalizedKey = String(key ?? "").trim();
    if (!normalizedKey) {
      return false;
    }

    await this.ensureLoaded();
    return this.keys.has(normalizedKey);
  }

  /**
   * 标记 key 已处理
   *
   * 设计约束：
   * - 只做“追加写”，不做昂贵的全量重写
   * - 目录不存在时自动创建
   */
  async mark(key: string): Promise<void> {
    const normalizedKey = String(key ?? "").trim();
    if (!normalizedKey) {
      return;
    }

    await this.ensureLoaded();
    if (this.keys.has(normalizedKey)) {
      return;
    }

    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });

    const line = JSON.stringify({
      key: normalizedKey,
      timestamp: new Date().toISOString(),
    });

    await fs.appendFile(this.filePath, `${line}\n`, "utf-8");
    this.keys.add(normalizedKey);
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) {
      return;
    }

    this.loaded = true;
    try {
      const content = await fs.readFile(this.filePath, "utf-8");
      const lines = content
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line) as { key?: unknown };
          const key = typeof parsed?.key === "string" ? parsed.key : "";
          const normalizedKey = key.trim();
          if (normalizedKey) {
            this.keys.add(normalizedKey);
          }
        } catch {
          /**
           * 容错：单行损坏直接跳过
           *
           * 说明：
           * - 这里故意不抛错，避免“幂等存储损坏”导致自动化采集完全不可用
           * - 后续如需要，可提供修复命令做重建/清理
           */
          continue;
        }
      }
    } catch {
      /**
       * 文件不存在或不可读：视为没有任何已处理 key
       *
       * 说明：
       * - 自动化采集是增强能力，不应影响主流程
       * - 因此这里保持静默，避免污染 CLI 输出
       */
      return;
    }
  }
}

