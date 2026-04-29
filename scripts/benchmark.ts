#!/usr/bin/env bun
/**
 * Performance Benchmark Script
 *
 * 测量现有系统的性能基准，建立 P99 延迟数据
 */

import { join } from "node:path";
import { cwd } from "node:process";
import { readFile, writeFile, mkdir } from "node:fs/promises";

const RESULTS_DIR = join(cwd(), "docs", "performance");

interface BenchmarkResult {
  operation: string;
  iterations: number;
  latencies: number[];
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
}

/**
 * 计算百分位数
 */
function calculatePercentile(values: number[], percentile: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

/**
 * 运行基准测试
 */
async function runBenchmark(
  operation: string,
  iterations: number,
  fn: () => Promise<void>
): Promise<BenchmarkResult> {
  console.log(`\n🔍 测量 ${operation}...`);
  const latencies: number[] = [];

  // 预热
  console.log(`  预热中...`);
  for (let i = 0; i < Math.min(5, iterations); i++) {
    await fn();
  }

  // 实际测量
  console.log(`  测量 ${iterations} 次迭代...`);
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await fn();
    const end = Date.now();
    const latency = end - start;
    latencies.push(latency);

    if ((i + 1) % 10 === 0) {
      console.log(`  进度: ${i + 1}/${iterations}`);
    }
  }

  // 计算统计指标
  const avg = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
  const min = Math.min(...latencies);
  const max = Math.max(...latencies);
  const p50 = calculatePercentile(latencies, 50);
  const p95 = calculatePercentile(latencies, 95);
  const p99 = calculatePercentile(latencies, 99);

  const result: BenchmarkResult = {
    operation,
    iterations,
    latencies,
    avg,
    min,
    max,
    p50,
    p95,
    p99
  };

  console.log(`  ✓ 完成`);
  console.log(`  平均: ${avg.toFixed(2)}ms`);
  console.log(`  P50: ${p50.toFixed(2)}ms`);
  console.log(`  P95: ${p95.toFixed(2)}ms`);
  console.log(`  P99: ${p99.toFixed(2)}ms`);

  return result;
}

/**
 * 保存基准测试结果
 */
async function saveResults(results: BenchmarkResult[]): Promise<void> {
  await mkdir(RESULTS_DIR, { recursive: true });

  const timestamp = new Date().toISOString();
  const filename = `baseline-${Date.now()}.json`;
  const filepath = join(RESULTS_DIR, filename);

  const data = {
    timestamp,
    results
  };

  await writeFile(filepath, JSON.stringify(data, null, 2));
  console.log(`\n💾 结果已保存到: ${filepath}`);

  // 更新最新的基准数据
  const latestPath = join(RESULTS_DIR, "baseline-latest.json");
  await writeFile(latestPath, JSON.stringify(data, null, 2));
  console.log(`💾 最新基准已更新: ${latestPath}`);
}

/**
 * 生成 Markdown 报告
 */
async function generateReport(results: BenchmarkResult[]): Promise<void> {
  const lines: string[] = [
    "# Performance Baseline Report",
    "",
    `**日期**: ${new Date().toLocaleDateString('zh-CN')}`,
    "",
    "## 测试结果",
    ""
  ];

  for (const result of results) {
    lines.push(`### ${result.operation}`, "");
    lines.push("| 指标 | 值 |");
    lines.push("|------|------|");
    lines.push(`| 迭代次数 | ${result.iterations} |`);
    lines.push(`| 平均延迟 | ${result.avg.toFixed(2)}ms |`);
    lines.push(`| 最小延迟 | ${result.min.toFixed(2)}ms |`);
    lines.push(`| 最大延迟 | ${result.max.toFixed(2)}ms |`);
    lines.push(`| P50 | ${result.p50.toFixed(2)}ms |`);
    lines.push(`| P95 | ${result.p95.toFixed(2)}ms |`);
    lines.push(`| **P99** | **${result.p99.toFixed(2)}ms** |`);
    lines.push("");
  }

  lines.push("## 性能预算", "");
  lines.push("基于基准数据，性能预算如下：", "");

  for (const result of results) {
    const ingestTarget = result.p99 + 50; // memohub_ingest_event
    const queryTarget = result.p99 + 100; // memohub_query

    lines.push(`### ${result.operation}`);
    lines.push(`- **基准 P99**: ${result.p99.toFixed(2)}ms`);
    lines.push(`- **ingest_event 目标**: ${ingestTarget.toFixed(2)}ms (+50ms)`);
    lines.push(`- **query 目标**: ${queryTarget.toFixed(2)}ms (+100ms)`);
    lines.push("");
  }

  const reportPath = join(RESULTS_DIR, "baseline.md");
  await writeFile(reportPath, lines.join("\n"));
  console.log(`📄 报告已生成: ${reportPath}`);
}

/**
 * 主函数
 */
async function main() {
  console.log("🚀 开始性能基准测试...\n");

  const results: BenchmarkResult[] = [];

  // TODO: 实际测量 memohub_add 的性能
  // 这里需要集成实际的 MemoryKernel 和 Track
  // 暂时使用模拟数据
  console.log("⚠️  注意: 这是模拟数据，需要集成实际的系统进行测量");

  // 模拟 memohub_add
  const addResult = await runBenchmark(
    "memohub_add",
    50,
    async () => {
      // 模拟操作
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    }
  );
  results.push(addResult);

  // 模拟 memohub_search
  const searchResult = await runBenchmark(
    "memohub_search",
    50,
    async () => {
      // 模拟操作
      await new Promise(resolve => setTimeout(resolve, 80 + Math.random() * 120));
    }
  );
  results.push(searchResult);

  // 保存结果
  await saveResults(results);

  // 生成报告
  await generateReport(results);

  console.log("\n✅ 基准测试完成！");
}

main().catch(console.error);
