/**
 * MemoHub 工具函数
 * 包含哈希计算、实体提取等功能
 */

import { createHash } from "crypto";
// @ts-ignore - tree-sitter-typescript 模块导入问题
import TypeScript from "tree-sitter-typescript";
import * as Parser from "tree-sitter";

/**
 * 计算文本的 SHA-256 哈希值
 * 用于去重和版本管理
 */
export function computeHash(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

/**
 * 从代码中提取实体（接口、函数、类名等）
 * 使用正则表达式提取（Tree-sitter 集成暂时禁用）
 */
export function extractEntitiesFromCode(
  code: string,
  language: string = "typescript"
): string[] {
  const entities: string[] = [];

  try {
    // 匹配函数声明
    const functionRegex = /(?:function|const)\s+(\w+)\s*(?:=\s*\(|\()/g;
    let match: RegExpExecArray | null;
    while ((match = functionRegex.exec(code)) !== null) {
      entities.push(match[1]);
    }

    // 匹配类声明
    const classRegex = /class\s+(\w+)/g;
    while ((match = classRegex.exec(code)) !== null) {
      entities.push(match[1]);
    }

    // 匹配接口声明
    const interfaceRegex = /interface\s+(\w+)/g;
    while ((match = interfaceRegex.exec(code)) !== null) {
      entities.push(match[1]);
    }

    // 匹配类型别名
    const typeRegex = /type\s+(\w+)\s*=/g;
    while ((match = typeRegex.exec(code)) !== null) {
      entities.push(match[1]);
    }

    // 匹配枚举声明
    const enumRegex = /enum\s+(\w+)/g;
    while ((match = enumRegex.exec(code)) !== null) {
      entities.push(match[1]);
    }

    // 匹配常量声明
    const constRegex = /const\s+(\w+)\s*=/g;
    while ((match = constRegex.exec(code)) !== null) {
      entities.push(match[1]);
    }

    return Array.from(new Set(entities)); // 去重

  } catch (err) {
    console.error("[MemoHub] 实体提取失败:", err);
    return [];
  }
}

/**
 * 使用正则表达式提取实体（AST 提取失败的 fallback）
 */
function extractEntitiesFromCodeRegex(code: string): string[] {
  const entities: string[] = [];

  // 匹配函数声明
  const functionRegex = /(?:function|const)\s+(\w+)\s*(?:=\s*\(|\()/g;
  let match;
  while ((match = functionRegex.exec(code)) !== null) {
    entities.push(match[1]);
  }

  // 匹配类声明
  const classRegex = /class\s+(\w+)/g;
  while ((match = classRegex.exec(code)) !== null) {
    entities.push(match[1]);
  }

  // 匹配接口声明
  const interfaceRegex = /interface\s+(\w+)/g;
  while ((match = interfaceRegex.exec(code)) !== null) {
    entities.push(match[1]);
  }

  // 匹配类型别名
  const typeRegex = /type\s+(\w+)\s*=/g;
  while ((match = typeRegex.exec(code)) !== null) {
    entities.push(match[1]);
  }

  return Array.from(new Set(entities)); // 去重
}

/**
 * 从查询文本中提取实体关键词
 * 用于混合检索的实体过滤
 */
export function extractEntitiesFromQuery(query: string): string[] {
  const entities: string[] = [];

  // 匹配函数调用模式
  const functionCallRegex = /(\w+)\s*\(/g;
  let match;
  while ((match = functionCallRegex.exec(query)) !== null) {
    entities.push(match[1]);
  }

  // 匹配类名模式（首字母大写）
  const classNameRegex = /\b([A-Z][a-zA-Z0-9]*)\b/g;
  while ((match = classNameRegex.exec(query)) !== null) {
    entities.push(match[1]);
  }

  // 匹配引用模式（单引号、双引号包裹的名称）
  const quotedRegex = /['"]([^'"]+)['"]/g;
  while ((match = quotedRegex.exec(query)) !== null) {
    entities.push(match[1]);
  }

  return Array.from(new Set(entities)); // 去重
}

/**
 * 混合检索：向量相似度 + 实体精确匹配
 * 返回重新排序的结果
 */
export interface HybridSearchResult {
  record: any;
  vector_score: number;
  entity_match_count: number;
  final_score: number;
}

export function hybridSearch(
  vectorResults: any[],
  queryEntities: string[]
): HybridSearchResult[] {
  return vectorResults
    .map((record) => {
      const recordEntities = record.entities || [];
      const entityMatches = queryEntities.filter((qe) =>
        recordEntities.some((re: string) =>
          re.toLowerCase().includes(qe.toLowerCase()) ||
          qe.toLowerCase().includes(re.toLowerCase())
        )
      );

      const vector_score = 1 - record._distance; // 转换为相似度
      const entity_match_count = entityMatches.length;

      // 混合评分：向量相似度 + 实体匹配加成
      // 如果有实体匹配，给加成 0.3
      const entity_bonus = entity_match_count > 0 ? 0.3 * (entity_match_count / queryEntities.length) : 0;
      const final_score = vector_score * 0.7 + entity_bonus * 0.3;

      return {
        record,
        vector_score,
        entity_match_count,
        final_score,
      };
    })
    .sort((a, b) => b.final_score - a.final_score); // 按最终评分降序排序
}
