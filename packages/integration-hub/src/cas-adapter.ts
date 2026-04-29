/**
 * CAS Adapter
 *
 * 适配 Content Addressable Storage (CAS) 用于内容去重
 */

import { ContentAddressableStorage } from "@memohub/storage-flesh";
import { IntegrationHubError, IntegrationErrorCode } from "@memohub/protocol";
import { PerformanceMonitor } from "@memohub/core";

export interface CASWriteResult {
  hash: string;
  exists: boolean;
}

/**
 * CAS 适配器
 *
 * 提供内容哈希计算、去重检查和写入功能
 */
export class CASAdapter {
  private cas: ContentAddressableStorage;
  private performance: PerformanceMonitor;

  constructor(cas: ContentAddressableStorage, performance: PerformanceMonitor) {
    this.cas = cas;
    this.performance = performance;
  }

  /**
   * 计算内容的哈希值
   */
  async computeHash(content: string): Promise<string> {
    const endTiming = this.performance.startOperation(
      "cas_compute_hash",
      `hash-${content.substring(0, 20)}...`,
      { contentLength: content.length }
    );

    try {
      // 使用 CAS 的哈希函数
      const hash = this.cas.computeHash(content);
      endTiming();
      return hash;
    } catch (error) {
      endTiming();
      throw IntegrationHubError.casWriteFailed(error as Error);
    }
  }

  /**
   * 检查哈希是否已存在
   */
  async checkExists(hash: string): Promise<boolean> {
    const endTiming = this.performance.startOperation(
      "cas_check_exists",
      hash,
      { hash }
    );

    try {
      // 使用 CAS 的 has 方法
      const exists = await this.cas.has(hash);
      endTiming();
      return exists;
    } catch (error) {
      endTiming();
      // 如果检查失败，假设不存在
      return false;
    }
  }

  /**
   * 写入内容到 CAS
   * 如果内容已存在，返回现有哈希
   */
  async writeContent(content: string): Promise<CASWriteResult> {
    const endTiming = this.performance.startOperation(
      "cas_write",
      `write-${content.substring(0, 20)}...`,
      { contentLength: content.length }
    );

    try {
      // 1. 计算哈希
      const hash = await this.computeHash(content);

      // 2. 检查是否已存在
      const exists = await this.checkExists(hash);

      if (exists) {
        endTiming();
        return { hash, exists: true };
      }

      // 3. 写入新内容
      await this.cas.write(content);
      endTiming();

      return { hash, exists: false };
    } catch (error) {
      endTiming();
      throw IntegrationHubError.casWriteFailed(error as Error);
    }
  }

  /**
   * 批量写入内容到 CAS
   * 适用于包含多个大负载的事件
   */
  async writeBatch(contents: string[]): Promise<Map<string, CASWriteResult>> {
    const results = new Map<string, CASWriteResult>();

    // 并行写入以提高性能
    const promises = contents.map(async (content, index) => {
      const result = await this.writeContent(content);
      return { index, result };
    });

    const settled = await Promise.all(promises);

    for (const { index, result } of settled) {
      results.set(contents[index], result);
    }

    return results;
  }

  /**
   * 从 CAS 读取内容
   */
  async readContent(hash: string): Promise<string | null> {
    try {
      return await this.cas.read(hash);
    } catch (error) {
      throw IntegrationHubError.internal(error as Error);
    }
  }
}
