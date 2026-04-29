/**
 * Performance Budget Configuration
 *
 * 定义性能预算和基准，确保系统性能在可接受范围内
 */

export interface PerformanceBudget {
  operation: string;
  baselineP99: number; // 基准 P99 延迟（ms）
  targetP99: number; // 目标 P99 延迟（ms）
  maxOverhead: number; // 最大允许开销（ms）
}

export interface PerformanceConfig {
  enabled: boolean;
  budgets: PerformanceBudget[];
  alertThreshold: number; // 超过预算的百分比阈值触发告警
}

/**
 * 性能预算配置
 *
 * 注意：这些是示例值，需要在实际测量后更新
 */
export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  enabled: true,
  alertThreshold: 1.2, // 超过目标 20% 时告警
  budgets: [
    {
      operation: "memohub_add",
      baselineP99: 0, // TODO: 在基准测试后更新
      targetP99: 0, // TODO: 设置为 baselineP99 + 50ms
      maxOverhead: 50 // ms
    },
    {
      operation: "memohub_search",
      baselineP99: 0, // TODO: 在基准测试后更新
      targetP99: 0, // TODO: 设置为 baselineP99 + 100ms
      maxOverhead: 100 // ms
    },
    {
      operation: "memohub_ingest_event",
      baselineP99: 0, // TODO: 在基准测试后更新
      targetP99: 0, // TODO: 设置为 memohub_add.baselineP99 + 50ms
      maxOverhead: 50 // ms
    },
    {
      operation: "memohub_query",
      baselineP99: 0, // TODO: 在基准测试后更新
      targetP99: 0, // TODO: 设置为 memohub_search.baselineP99 + 100ms
      maxOverhead: 100 // ms
    }
  ]
};

/**
 * 验证性能指标是否在预算范围内
 */
export function validatePerformanceBudget(
  operation: string,
  actualP99: number,
  config: PerformanceConfig
): { withinBudget: boolean; exceededBy?: number } {
  const budget = config.budgets.find(b => b.operation === operation);

  if (!budget) {
    // 没有配置预算，假设在范围内
    return { withinBudget: true };
  }

  // 如果还没有设置基准，无法验证
  if (budget.targetP99 === 0) {
    return { withinBudget: true };
  }

  if (actualP99 <= budget.targetP99) {
    return { withinBudget: true };
  }

  return {
    withinBudget: false,
    exceededBy: actualP99 - budget.targetP99
  };
}

/**
 * 更新性能预算（在基准测试后调用）
 */
export function updatePerformanceBudget(
  operation: string,
  baselineP99: number,
  maxOverhead: number,
  config: PerformanceConfig
): void {
  const budget = config.budgets.find(b => b.operation === operation);

  if (budget) {
    budget.baselineP99 = baselineP99;
    budget.targetP99 = baselineP99 + maxOverhead;
    budget.maxOverhead = maxOverhead;
  }
}
