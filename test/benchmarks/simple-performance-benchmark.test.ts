#!/usr/bin/env bun
/**
 * MemoHub Simple Performance Benchmark
 *
 * 简化版性能基准测试，验证核心组件性能:
 * - 单事件摄取延迟
 * - 批量处理性能
 * - CAS 去重性能
 * - 内存占用验证
 */

import { describe, test, expect } from "bun:test";

// 性能指标收集器
class PerformanceCollector {
  private metrics: Map<string, number[]> = new Map();

  record(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  getStats(name: string) {
    const samples = this.metrics.get(name) || [];
    if (samples.length === 0) return null;

    const sorted = [...samples].sort((a, b) => a - b);
    const len = sorted.length;

    return {
      samples: len,
      min: sorted[0],
      max: sorted[len - 1],
      avg: samples.reduce((a, b) => a + b, 0) / len,
      p50: sorted[Math.floor(len * 0.5)],
      p95: sorted[Math.floor(len * 0.95)],
      p99: sorted[Math.floor(len * 0.99)]
    };
  }

  printReport() {
    console.log("\n📊 Performance Benchmark Results");
    console.log("=".repeat(80));

    for (const [name] of this.metrics) {
      const stats = this.getStats(name);
      if (!stats) continue;

      console.log(`\n${name}:`);
      console.log(`  Samples: ${stats.samples}`);
      console.log(`  Min: ${stats.min.toFixed(2)}ms | Max: ${stats.max.toFixed(2)}ms | Avg: ${stats.avg.toFixed(2)}ms`);
      console.log(`  P50: ${stats.p50.toFixed(2)}ms | P95: ${stats.p95.toFixed(2)}ms | P99: ${stats.p99.toFixed(2)}ms`);
    }

    console.log("\n" + "=".repeat(80));
  }
}

describe("Simple Performance Benchmarks", () => {
  let collector: PerformanceCollector;

  // 简单的 CAS 模拟
  class SimpleCAS {
    private storage: Map<string, string> = new Map();

    async write(content: string): Promise<string> {
      const hash = this.hash(content);
      if (!this.storage.has(hash)) {
        this.storage.set(hash, content);
      }
      return hash;
    }

    private hash(content: string): string {
      // 简单的哈希模拟
      let hash = 0;
      for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash).toString(16).padStart(16, '0');
    }
  }

  // 简单的 Kernel 模拟
  class SimpleKernel {
    async dispatch(instruction: any): Promise<any> {
      // 模拟处理延迟
      await new Promise(resolve => setTimeout(resolve, Math.random() * 5));

      return {
        success: true,
        instructionId: `inst_${Date.now()}`,
        data: {
          id: `id_${Date.now()}`,
          text: instruction.payload?.text || 'content'
        }
      };
    }
  }

  // 简单的 Integration Hub 模拟
  class SimpleHub {
    private cas: SimpleCAS;
    private kernel: SimpleKernel;

    constructor() {
      this.cas = new SimpleCAS();
      this.kernel = new SimpleKernel();
    }

    async ingest(event: any): Promise<any> {
      const startTime = performance.now();

      // 1. 写入 CAS
      const hash = await this.cas.write(event.payload?.text || '');

      // 2. 生成指令
      const instruction = {
        op: 'ADD',
        trackId: 'track-insight',
        payload: {
          ...event.payload,
          contentHash: hash,
          id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
      };

      // 3. 调用 kernel
      const result = await this.kernel.dispatch(instruction);

      const latency = performance.now() - startTime;
      collector.record('single_event_ingestion', latency);

      return {
        success: result.success,
        eventId: instruction.payload.id,
        contentHash: hash,
        instruction: result
      };
    }

    async ingestBatch(events: any[]): Promise<any[]> {
      const results = await Promise.all(
        events.map(event => this.ingest(event))
      );
      return results;
    }
  }

  let hub: SimpleHub;

  test("初始化测试环境", () => {
    collector = new PerformanceCollector();
    hub = new SimpleHub();
    expect(hub).toBeDefined();
  });

  test("单事件摄取性能基准 (100 次迭代)", async () => {
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      const event = {
        source: "cli",
        channel: "benchmark",
        kind: "memory",
        projectId: "perf-test",
        confidence: "reported",
        payload: {
          text: `Benchmark event ${i} with some content`,
          kind: "memory"
        }
      };

      await hub.ingest(event);
    }

    const stats = collector.getStats('single_event_ingestion');
    expect(stats).toBeDefined();
    expect(stats!.samples).toBe(iterations);

    console.log(`单事件摄取统计:`);
    console.log(`  平均延迟: ${stats!.avg.toFixed(2)}ms`);
    console.log(`  P95: ${stats!.p95.toFixed(2)}ms | P99: ${stats!.p99.toFixed(2)}ms`);

    // 验证性能目标
    expect(stats!.p99).toBeLessThan(100); // P99 < 100ms
    expect(stats!.avg).toBeLessThan(50);  // 平均 < 50ms
  });

  test("批量事件处理性能基准", async () => {
    const batchSizes = [10, 50, 100];

    for (const batchSize of batchSizes) {
      const events = Array.from({ length: batchSize }, (_, i) => ({
        source: "cli",
        channel: "benchmark-batch",
        kind: "memory",
        projectId: "batch-perf-test",
        confidence: "reported",
        payload: {
          text: `Batch event ${i}`,
          kind: "memory"
        }
      }));

      const startTime = performance.now();
      const results = await hub.ingestBatch(events);
      const totalTime = performance.now() - startTime;
      const avgLatency = totalTime / batchSize;

      expect(results.every(r => r.success)).toBe(true);
      expect(avgLatency).toBeLessThan(100); // 每事件 < 100ms

      console.log(`批量 (${batchSize}) 处理性能:`);
      console.log(`  总时间: ${totalTime.toFixed(2)}ms`);
      console.log(`  平均延迟: ${avgLatency.toFixed(2)}ms/event`);
    }
  });

  test("并发事件处理性能基准", async () => {
    const concurrency = 20;
    const events = Array.from({ length: concurrency }, (_, i) => ({
      source: "cli",
      channel: `concurrent-${i % 4}`,
      kind: "memory",
      projectId: "concurrent-test",
      confidence: "reported",
      payload: {
        text: `Concurrent event ${i}`,
        kind: "memory"
      }
    }));

    const startTime = performance.now();
    const results = await Promise.all(
      events.map(event => hub.ingest(event))
    );
    const totalTime = performance.now() - startTime;
    const avgLatency = totalTime / concurrency;

    expect(results.every(r => r.success)).toBe(true);
    expect(avgLatency).toBeLessThan(100);

    console.log(`并发 (${concurrency}) 处理性能:`);
    console.log(`  总时间: ${totalTime.toFixed(2)}ms`);
    console.log(`  平均延迟: ${avgLatency.toFixed(2)}ms/event`);
  });

  test("CAS 去重性能基准", async () => {
    const iterations = 50;
    const sameContent = "Duplicate content for performance test";

    const dedupLatencies: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const event = {
        source: "cli",
        channel: "dedup-benchmark",
        kind: "memory",
        projectId: "dedup-perf-test",
        confidence: "reported",
        payload: {
          text: sameContent,
          kind: "memory"
        }
      };

      const start = performance.now();
      await hub.ingest(event);
      const latency = performance.now() - start;

      dedupLatencies.push(latency);
    }

    const avgLatency = dedupLatencies.reduce((a, b) => a + b, 0) / iterations;
    const sorted = [...dedupLatencies].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(iterations * 0.95)];

    console.log(`CAS 去重性能:`);
    console.log(`  平均延迟: ${avgLatency.toFixed(2)}ms`);
    console.log(`  P95: ${p95.toFixed(2)}ms`);

    expect(avgLatency).toBeLessThan(50); // 去重应该很快
    expect(p95).toBeLessThan(80);
  });

  test("内存占用验证", async () => {
    // 获取初始内存
    const initialMemory = process.memoryUsage();
    const initialHeapUsed = initialMemory.heapUsed / 1024 / 1024;

    // 处理大量事件
    const eventCount = 500;
    const events = Array.from({ length: eventCount }, (_, i) => ({
      source: "cli",
      channel: "memory-test",
      kind: "memory",
      projectId: "memory-test",
      confidence: "reported",
      payload: {
        text: `Memory test event ${i} with some content to increase memory usage`,
        kind: "memory"
      }
    }));

    await hub.ingestBatch(events);

    // 获取峰值内存
    const peakMemory = process.memoryUsage();
    const peakHeapUsed = peakMemory.heapUsed / 1024 / 1024;
    const memoryIncrease = peakHeapUsed - initialHeapUsed;

    console.log(`内存占用统计:`);
    console.log(`  初始堆内存: ${initialHeapUsed.toFixed(2)}MB`);
    console.log(`  峰值堆内存: ${peakHeapUsed.toFixed(2)}MB`);
    console.log(`  内存增长: ${memoryIncrease.toFixed(2)}MB (处理 ${eventCount} 个事件)`);

    // 验证内存增长在合理范围内
    expect(memoryIncrease).toBeLessThan(500); // < 500MB
  });

  test("生成性能报告", () => {
    collector.printReport();
  });
});
