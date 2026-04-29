/**
 * Performance Monitoring Module
 *
 * 提供性能监控和测量功能，用于跟踪系统性能基准
 */

export interface PerformanceEvent {
  traceId: string;
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  metadata?: Record<string, unknown>;
}

export interface PerformanceMetrics {
  operation: string;
  count: number;
  totalDuration: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p50: number;
  p95: number;
  p99: number;
}

export class PerformanceMonitor {
  private events: PerformanceEvent[] = [];
  private metrics: Map<string, number[]> = new Map();

  /**
   * 记录性能事件
   */
  recordEvent(event: PerformanceEvent): void {
    this.events.push(event);

    // 更新指标
    if (!this.metrics.has(event.operation)) {
      this.metrics.set(event.operation, []);
    }
    this.metrics.get(event.operation)!.push(event.duration);
  }

  /**
   * 开始测量
   */
  startOperation(operation: string, traceId: string, metadata?: Record<string, unknown>): () => void {
    const startTime = Date.now();

    return () => {
      const endTime = Date.now();
      const duration = endTime - startTime;

      this.recordEvent({
        traceId,
        operation,
        startTime,
        endTime,
        duration,
        metadata
      });
    };
  }

  /**
   * 计算百分位数
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  /**
   * 获取操作的性能指标
   */
  getMetrics(operation: string): PerformanceMetrics | null {
    const durations = this.metrics.get(operation);
    if (!durations || durations.length === 0) {
      return null;
    }

    const count = durations.length;
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const avgDuration = totalDuration / count;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    return {
      operation,
      count,
      totalDuration,
      avgDuration,
      minDuration,
      maxDuration,
      p50: this.calculatePercentile(durations, 50),
      p95: this.calculatePercentile(durations, 95),
      p99: this.calculatePercentile(durations, 99)
    };
  }

  /**
   * 获取所有操作的指标
   */
  getAllMetrics(): Map<string, PerformanceMetrics> {
    const result = new Map<string, PerformanceMetrics>();

    for (const operation of this.metrics.keys()) {
      const metrics = this.getMetrics(operation);
      if (metrics) {
        result.set(operation, metrics);
      }
    }

    return result;
  }

  /**
   * 重置监控数据
   */
  reset(): void {
    this.events = [];
    this.metrics.clear();
  }

  /**
   * 获取所有事件
   */
  getEvents(): PerformanceEvent[] {
    return [...this.events];
  }
}

/**
 * 全局性能监控实例
 */
export const globalPerformanceMonitor = new PerformanceMonitor();
