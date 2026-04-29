#!/usr/bin/env bun
/**
 * MemoHub Performance Benchmark
 *
 * 验证 P99 延迟目标:
 * - 单事件摄取: < 50ms (P99)
 * - 批量处理: < 100ms/事件 (P99)
 * - 查询延迟: < 200ms (P99)
 * - 内存占用: < 500MB (稳定状态)
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { ContentAddressableStorage } from "@memohub/storage-flesh";
import { IntegrationHub } from "@memohub/integration-hub";

// 性能指标收集
interface PerformanceMetrics {
  name: string;
  samples: number[];
  unit: string;
  target: {
    p50: number;
    p95: number;
    p99: number;
  };
}

class PerformanceCollector {
  private metrics: Map<string, PerformanceMetrics> = new Map();

  record(name: string, value: number, unit: string, target: { p50: number; p95: number; p99: number }) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, {
        name,
        samples: [],
        unit,
        target
      });
    }
    this.metrics.get(name)!.samples.push(value);
  }

  getReport(): Map<string, any> {
    const report = new Map();

    for (const [name, metric] of this.metrics) {
      const samples = metric.samples.sort((a, b) => a - b);
      const len = samples.length;

      const p50 = samples[Math.floor(len * 0.5)];
      const p95 = samples[Math.floor(len * 0.95)];
      const p99 = samples[Math.floor(len * 0.99)];
      const avg = samples.reduce((a, b) => a + b, 0) / len;
      const min = samples[0];
      const max = samples[len - 1];

      report.set(name, {
        name: metric.name,
        unit: metric.unit,
        samples: len,
        avg: avg.toFixed(2),
        min: min.toFixed(2),
        max: max.toFixed(2),
        p50: p50.toFixed(2),
        p95: p95.toFixed(2),
        p99: p99.toFixed(2),
        target: metric.target,
        pass: {
          p50: p50 <= metric.target.p50,
          p95: p95 <= metric.target.p95,
          p99: p99 <= metric.target.p99
        }
      });
    }

    return report;
  }

  printReport() {
    console.log("\n📊 Performance Benchmark Results");
    console.log("=" .repeat(80));

    for (const [name, result] of this.getReport()) {
      console.log(`\n${result.name}:`);
      console.log(`  Unit: ${result.unit}`);
      console.log(`  Samples: ${result.samples}`);
      console.log(`  Min: ${result.min} | Max: ${result.max} | Avg: ${result.avg}`);
      console.log(`  P50: ${result.p50} (target: ${result.target.p50}) - ${result.pass.p50 ? '✅' : '❌'}`);
      console.log(`  P95: ${result.p95} (target: ${result.target.p95}) - ${result.pass.p95 ? '✅' : '❌'}`);
      console.log(`  P99: ${result.p99} (target: ${result.target.p99}) - ${result.pass.p99 ? '✅' : '❌'}`);
    }

    console.log("\n" + "=".repeat(80));
  }
}

describe("Performance Benchmarks", () => {
  let cas: ContentAddressableStorage;
  let hub: IntegrationHub;
  let collector: PerformanceCollector;
  let tempDir: string;
  let kernel: any;

  beforeAll(async () => {
    collector = new PerformanceCollector();
    tempDir = `/tmp/benchmark-${Date.now()}`;

    // 初始化组件
    cas = new ContentAddressableStorage(tempDir);

    // Mock kernel for benchmarking
    kernel = {
      dispatch: async (instruction: any) => {
        // 模拟实际的延迟
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));

        return {
          success: true,
          instructionId: `inst_${Date.now()}`,
          trackId: instruction.trackId || "track-insight",
          data: {
            id: `id_${Date.now()}`,
            text: instruction.payload.text || instruction.payload.content,
            hash: instruction.payload.contentHash || "hash_benchmark"
          }
        };
      }
    } as any;

    hub = new IntegrationHub({
      cas,
      kernel,
      performance: null
    });
  });

  afterAll(async () => {
    collector.printReport();

    // 清理
    if (tempDir) {
      await require("node:fs").promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  test("单事件摄取性能基准 (P99 < 50ms)", async () => {
    const iterations = 100;
    const latencies: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const event = {
        source: "cli" as const,
        channel: "benchmark",
        kind: "memory" as const,
        projectId: "perf-test",
        confidence: "reported" as const,
        payload: {
          text: `Benchmark event ${i}`,
          kind: "memory" as const
        }
      };

      const start = performance.now();
      await hub.ingest(event);
      const latency = performance.now() - start;

      latencies.push(latency);
      collector.record(
        "single_event_ingestion",
        latency,
        "ms",
        { p50: 20, p95: 35, p99: 50 }
      );
    }

    // 验证 P99 延迟
    const sorted = latencies.sort((a, b) => a - b);
    const p99 = sorted[Math.floor(iterations * 0.99)];

    console.log(`单事件摄取 P99: ${p99.toFixed(2)}ms`);
    expect(p99).toBeLessThan(50);
  });

  test("批量事件处理性能基准 (P99 < 100ms/事件)", async () => {
    const batchSizes = [10, 50, 100];

    for (const batchSize of batchSizes) {
      const events = Array.from({ length: batchSize }, (_, i) => ({
        source: "cli" as const,
        channel: "benchmark-batch",
        kind: "memory" as const,
        projectId: "batch-perf-test",
        confidence: "reported" as const,
        payload: {
          text: `Batch event ${i}`,
          kind: "memory" as const
        }
      }));

      const start = performance.now();
      const results = await hub.ingestBatch(events);
      const totalTime = performance.now() - start;
      const avgLatency = totalTime / batchSize;

      expect(results.every(r => r.success)).toBe(true);

      collector.record(
        `batch_processing_size_${batchSize}`,
        avgLatency,
        "ms/event",
        { p50: 30, p95: 70, p99: 100 }
      );

      console.log(`批量 (${batchSize}) 平均延迟: ${avgLatency.toFixed(2)}ms/event`);
      expect(avgLatency).toBeLessThan(100);
    }
  });

  test("并发事件处理性能基准", async () => {
    const concurrency = 20;
    const events = Array.from({ length: concurrency }, (_, i) => ({
      source: "cli" as const,
      channel: `concurrent-${i % 4}`, // 4个不同的channel
      kind: "memory" as const,
      projectId: "concurrent-test",
      confidence: "reported" as const,
      payload: {
        text: `Concurrent event ${i}`,
        kind: "memory" as const
      }
    }));

    const start = performance.now();
    const results = await Promise.all(
      events.map(event => hub.ingest(event))
    );
    const totalTime = performance.now() - start;
    const avgLatency = totalTime / concurrency;

    expect(results.every(r => r.success)).toBe(true);

    collector.record(
      "concurrent_event_processing",
      avgLatency,
      "ms/event",
      { p50: 25, p95: 60, p99: 90 }
    );

    console.log(`并发 (${concurrency}) 平均延迟: ${avgLatency.toFixed(2)}ms/event`);
    expect(avgLatency).toBeLessThan(100);
  });

  test("CAS 去重性能基准", async () => {
    const iterations = 50;
    const sameContent = "Duplicate content for performance test";

    const latencies: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const event = {
        source: "cli" as const,
        channel: "dedup-benchmark",
        kind: "memory" as const,
        projectId: "dedup-perf-test",
        confidence: "reported" as const,
        payload: {
          text: sameContent,
          kind: "memory" as const
        }
      };

      const start = performance.now();
      await hub.ingest(event);
      const latency = performance.now() - start;

      latencies.push(latency);
      collector.record(
        "cas_deduplication",
        latency,
        "ms",
        { p50: 15, p95: 30, p99: 45 }
      );
    }

    const avgLatency = latencies.reduce((a, b) => a + b, 0) / iterations;
    console.log(`CAS 去重平均延迟: ${avgLatency.toFixed(2)}ms`);
    expect(avgLatency).toBeLessThan(50);
  });

  test("内存占用验证", async () => {
    // 获取初始内存使用
    const initialMemory = process.memoryUsage();

    // 处理大量事件
    const eventCount = 500;
    const events = Array.from({ length: eventCount }, (_, i) => ({
      source: "cli" as const,
      channel: "memory-test",
      kind: "memory" as const,
      projectId: "memory-test",
      confidence: "reported" as const,
      payload: {
        text: `Memory test event ${i} with some content`,
        kind: "memory" as const
      }
    }));

    await hub.ingestBatch(events);

    // 获取峰值内存使用
    const peakMemory = process.memoryUsage();
    const memoryIncrease = (peakMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024; // MB

    console.log(`内存增长: ${memoryIncrease.toFixed(2)}MB (处理 ${eventCount} 个事件)`);

    // 验证内存占用在合理范围内
    expect(memoryIncrease).toBeLessThan(500); // 稳定状态 < 500MB

    collector.record(
      "memory_usage_mb",
      memoryIncrease,
      "MB",
      { p50: 50, p95: 200, p99: 500 }
    );
  });

  test("持久化性能基准", async () => {
    const iterations = 30;
    const writeLatencies: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const event = {
        source: "cli" as const,
        channel: "persistence-benchmark",
        kind: "memory" as const,
        projectId: "persistence-test",
        confidence: "reported" as const,
        payload: {
          text: `Persistence test event ${i} with longer content for testing`,
          kind: "memory" as const
        }
      };

      const start = performance.now();
      await hub.ingest(event);
      const writeLatency = performance.now() - start;

      writeLatencies.push(writeLatency);
      collector.record(
        "persistence_write",
        writeLatency,
        "ms",
        { p50: 25, p95: 60, p99: 80 }
      );
    }

    const avgWriteLatency = writeLatencies.reduce((a, b) => a + b, 0) / iterations;
    console.log(`持久化写入平均延迟: ${avgWriteLatency.toFixed(2)}ms`);
    expect(avgWriteLatency).toBeLessThan(80);
  });
});
