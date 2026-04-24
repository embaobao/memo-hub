/**
 * MemoHub 工具函数
 * 包含哈希计算、实体提取等功能
 */

import { createHash } from "crypto";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { Language, Parser } from "web-tree-sitter";

const require = createRequire(import.meta.url);

/**
 * 代码符号类型（用于代码轨的“语义实体”抽取）
 *
 * 说明：
 * - 这里的 kind 不是 Tree-sitter 的节点类型一比一映射，而是对业务更友好的抽象。
 * - 之所以用联合类型而不是 enum，是为了让 metadata 序列化更直观、可读性更好。
 */
export type CodeSymbolKind =
  | "function"
  | "class"
  | "interface"
  | "type"
  | "enum"
  | "variable"
  | "export"
  | "unknown";

/**
 * 代码片段范围（用于定位符号在原文中的位置）
 *
 * 说明：
 * - startIndex/endIndex：字节偏移（UTF-8 bytes，与 Tree-sitter 的 startIndex/endIndex 对齐）
 * - 行列信息用 0-based（与 Tree-sitter 的 row/column 对齐），上层展示时可自行 +1
 */
export interface CodeSpan {
  startIndex: number;
  endIndex: number;
  startRow: number;
  startColumn: number;
  endRow: number;
  endColumn: number;
}

/**
 * 单个符号抽取结果
 *
 * 说明：
 * - isExported：标记该符号是否“被导出”（用于优先挑选 symbol_name、也便于检索过滤）
 * - range：符号自身节点的范围（通常为标识符或声明节点范围）
 */
export interface CodeSymbol {
  name: string;
  kind: CodeSymbolKind;
  isExported: boolean;
  range: CodeSpan;
}

/**
 * 从代码中抽取到的元数据
 *
 * 说明：
 * - parseEngine：本次抽取使用的引擎（tree-sitter 或 regex 兜底）
 * - primarySymbol：用于作为“主符号名”的候选（优先导出符号，其次第一个符号）
 */
export interface ExtractedCodeMetadata {
  language: string;
  parseEngine: "tree-sitter" | "regex";
  symbols: CodeSymbol[];
  primarySymbol?: CodeSymbol;
}

/**
 * 计算文本的 SHA-256 哈希值
 * 用于去重和版本管理
 */
export function computeHash(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

/**
 * 从代码中提取实体（接口、函数、类名等）
 *
 * 说明：
 * - 优先使用 Tree-sitter 做 AST 解析（至少覆盖 TS/JS）
 * - 如果 Tree-sitter 依赖缺失 / 解析异常，则回退到正则提取（保证能力不退化）
 *
 * 注意：
 * - 该函数为了兼容旧调用点，仍然只返回 entities（符号名数组）
 * - 更完整的结构化信息请使用 extractCodeEntitiesAndMetadata
 */
export async function extractEntitiesFromCode(
  code: string,
  language: string = "typescript"
): Promise<string[]> {
  try {
    const { entities } = await extractCodeEntitiesAndMetadata(code, language);
    return entities;
  } catch (err) {
    console.error("[MemoHub] 实体提取失败（将返回空数组）:", err);
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

  // 匹配枚举声明（补齐与旧实现一致的覆盖面）
  const enumRegex = /enum\s+(\w+)/g;
  while ((match = enumRegex.exec(code)) !== null) {
    entities.push(match[1]);
  }

  // 匹配常量声明（尽量把箭头函数等变量承载的符号也纳入实体纽带）
  const constRegex = /const\s+(\w+)\s*=/g;
  while ((match = constRegex.exec(code)) !== null) {
    entities.push(match[1]);
  }

  return Array.from(new Set(entities)); // 去重
}

function normalizeLanguageId(language: string): string {
  const normalized = String(language ?? "").trim().toLowerCase();
  if (!normalized) {
    return "unknown";
  }
  if (normalized === "ts") {
    return "typescript";
  }
  if (normalized === "tsx") {
    return "tsx";
  }
  if (normalized === "js") {
    return "javascript";
  }
  if (normalized === "jsx") {
    return "jsx";
  }
  return normalized;
}

function toSpan(node: any): CodeSpan {
  const startPosition = node?.startPosition ?? { row: 0, column: 0 };
  const endPosition = node?.endPosition ?? { row: 0, column: 0 };

  return {
    startIndex: typeof node?.startIndex === "number" ? node.startIndex : 0,
    endIndex: typeof node?.endIndex === "number" ? node.endIndex : 0,
    startRow: typeof startPosition?.row === "number" ? startPosition.row : 0,
    startColumn: typeof startPosition?.column === "number" ? startPosition.column : 0,
    endRow: typeof endPosition?.row === "number" ? endPosition.row : 0,
    endColumn: typeof endPosition?.column === "number" ? endPosition.column : 0,
  };
}

let webTreeSitterInitPromise: Promise<void> | null = null;
const webLanguageCache = new Map<string, Promise<Language | null>>();

async function ensureWebTreeSitterInitialized(): Promise<void> {
  if (!webTreeSitterInitPromise) {
    webTreeSitterInitPromise = Parser.init();
  }
  await webTreeSitterInitPromise;
}

/**
 * 以“可选依赖”的方式加载 Tree-sitter 语言（WASM）
 *
 * 背景：
 * - Bun 环境下直接使用 native tree-sitter（NAPI）会遇到预编译产物缺失的问题
 * - web-tree-sitter 使用 WASM，可以在 Bun/Node 环境稳定运行
 * - 语言语法包（tree-sitter-typescript / tree-sitter-javascript）会携带对应的 .wasm 文件
 *
 * 设计：
 * - 不在模块顶层强依赖具体语言包；依赖缺失时返回 null，外层回退到正则提取
 * - 语言加载做缓存，避免每次写入都重复读取 .wasm
 */
async function loadWebTreeSitterLanguage(languageId: string): Promise<Language | null> {
  const normalized = normalizeLanguageId(languageId);

  const cached = webLanguageCache.get(normalized);
  if (cached) {
    return cached;
  }

  const loadPromise = (async () => {
    try {
      await ensureWebTreeSitterInitialized();

      let wasmPath: string | undefined;

      if (normalized === "typescript") {
        wasmPath = require.resolve("tree-sitter-typescript/tree-sitter-typescript.wasm");
      } else if (normalized === "tsx") {
        wasmPath = require.resolve("tree-sitter-typescript/tree-sitter-tsx.wasm");
      } else if (normalized === "javascript") {
        wasmPath = require.resolve("tree-sitter-javascript/tree-sitter-javascript.wasm");
      } else if (normalized === "jsx") {
        try {
          wasmPath = require.resolve("tree-sitter-javascript/tree-sitter-jsx.wasm");
        } catch {
          wasmPath = require.resolve("tree-sitter-javascript/tree-sitter-javascript.wasm");
        }
      } else {
        return null;
      }

      const wasmBuffer = await readFile(wasmPath);
      return await Language.load(new Uint8Array(wasmBuffer));
    } catch {
      return null;
    }
  })();

  webLanguageCache.set(normalized, loadPromise);
  return loadPromise;
}

function pickPrimarySymbol(symbols: CodeSymbol[]): CodeSymbol | undefined {
  const exported = symbols.find((s) => s.isExported);
  return exported ?? symbols[0];
}

function addSymbol(
  target: CodeSymbol[],
  symbol: { name: string; kind: CodeSymbolKind; isExported: boolean; range: CodeSpan }
) {
  const name = String(symbol.name ?? "").trim();
  if (!name) {
    return;
  }

  target.push({
    name,
    kind: symbol.kind,
    isExported: symbol.isExported,
    range: symbol.range,
  });
}

function getNodeText(node: any): string {
  if (!node) {
    return "";
  }

  /**
   * web-tree-sitter 的 SyntaxNode 提供 text getter：
   * - 内部会基于原始输入正确处理 UTF-8 字节偏移
   * - 可以避免直接用 startIndex/endIndex 去 slice JS 字符串导致的多字节错位
   */
  try {
    const text = node.text;
    return typeof text === "string" ? text : "";
  } catch {
    return "";
  }
}

function collectVariableNamesFromPattern(patternNode: any): string[] {
  if (!patternNode) {
    return [];
  }

  const t = String(patternNode.type ?? "");
  if (t === "identifier") {
    const text = getNodeText(patternNode).trim();
    return text ? [text] : [];
  }

  if (t === "object_pattern" || t === "array_pattern") {
    const names: string[] = [];
    const children = Array.isArray(patternNode.namedChildren) ? patternNode.namedChildren : [];
    for (const child of children) {
      names.push(...collectVariableNamesFromPattern(child));
    }
    return names;
  }

  if (t === "assignment_pattern") {
    const left = patternNode.childForFieldName?.("left");
    return collectVariableNamesFromPattern(left);
  }

  return [];
}

function collectSymbolsFromAst(rootNode: any): CodeSymbol[] {
  const symbols: CodeSymbol[] = [];

  /**
   * 递归遍历 AST
   *
   * 说明：
   * - Tree-sitter 节点结构因语言而异，这里采用“尽量通用”的策略：
   *   - 识别常见声明节点：function/class/interface/type/enum/variable
   *   - 识别导出节点：export_statement/export_default_declaration/export_clause/export_specifier
   * - 如果后续要扩展更多语言或更精细的符号类型，可在这里逐步补齐映射
   */
  const walk = (node: any, isExported: boolean) => {
    if (!node) {
      return;
    }

    const nodeType = String(node.type ?? "");

    if (
      nodeType === "export_statement" ||
      nodeType === "export_default_declaration" ||
      nodeType === "export_named_declaration"
    ) {
      const children = Array.isArray(node.namedChildren) ? node.namedChildren : [];
      for (const child of children) {
        walk(child, true);
      }
      return;
    }

    if (nodeType === "export_clause") {
      const children = Array.isArray(node.namedChildren) ? node.namedChildren : [];
      for (const child of children) {
        walk(child, true);
      }
      return;
    }

    if (nodeType === "export_specifier") {
      const nameNode = node.childForFieldName?.("name");
      const aliasNode = node.childForFieldName?.("alias");
      const raw = getNodeText(aliasNode ?? nameNode).trim();
      addSymbol(symbols, {
        name: raw,
        kind: "export",
        isExported: true,
        range: toSpan(aliasNode ?? nameNode ?? node),
      });
      return;
    }

    if (nodeType === "function_declaration" || nodeType === "generator_function_declaration") {
      const nameNode = node.childForFieldName?.("name");
      addSymbol(symbols, {
        name: getNodeText(nameNode).trim(),
        kind: "function",
        isExported,
        range: toSpan(nameNode ?? node),
      });
    }

    if (nodeType === "class_declaration") {
      const nameNode = node.childForFieldName?.("name");
      addSymbol(symbols, {
        name: getNodeText(nameNode).trim(),
        kind: "class",
        isExported,
        range: toSpan(nameNode ?? node),
      });
    }

    if (nodeType === "interface_declaration") {
      const nameNode = node.childForFieldName?.("name");
      addSymbol(symbols, {
        name: getNodeText(nameNode).trim(),
        kind: "interface",
        isExported,
        range: toSpan(nameNode ?? node),
      });
    }

    if (nodeType === "type_alias_declaration") {
      const nameNode = node.childForFieldName?.("name");
      addSymbol(symbols, {
        name: getNodeText(nameNode).trim(),
        kind: "type",
        isExported,
        range: toSpan(nameNode ?? node),
      });
    }

    if (nodeType === "enum_declaration") {
      const nameNode = node.childForFieldName?.("name");
      addSymbol(symbols, {
        name: getNodeText(nameNode).trim(),
        kind: "enum",
        isExported,
        range: toSpan(nameNode ?? node),
      });
    }

    if (nodeType === "lexical_declaration" || nodeType === "variable_declaration") {
      const declarators: any[] = [];
      const namedChildren = Array.isArray(node.namedChildren) ? node.namedChildren : [];
      for (const child of namedChildren) {
        if (String(child?.type ?? "") === "variable_declarator") {
          declarators.push(child);
        }
      }

      for (const declarator of declarators) {
        const nameNode = declarator.childForFieldName?.("name");
        const names = collectVariableNamesFromPattern(nameNode);
        for (const name of names) {
          addSymbol(symbols, {
            name,
            kind: "variable",
            isExported,
            range: toSpan(nameNode ?? declarator),
          });
        }
      }
    }

    const children = Array.isArray(node.namedChildren) ? node.namedChildren : [];
    for (const child of children) {
      walk(child, isExported);
    }
  };

  walk(rootNode, false);
  return symbols;
}

/**
 * 从代码文本中抽取“实体纽带（entities）”与“结构化元数据（metadata）”
 *
 * 说明：
 * - entities：仅包含符号名（字符串），用于索引与混合检索的轻量特征
 * - metadata：包含符号类型、是否导出、片段范围等结构化信息，便于后续做更精细的过滤/展示
 */
export async function extractCodeEntitiesAndMetadata(
  code: string,
  language: string = "typescript"
): Promise<{ entities: string[]; metadata: ExtractedCodeMetadata }> {
  const languageId = normalizeLanguageId(language);
  const source = String(code ?? "");

  const lang = await loadWebTreeSitterLanguage(languageId);
  if (!lang) {
    const entities = extractEntitiesFromCodeRegex(source);
    return {
      entities,
      metadata: {
        language: languageId,
        parseEngine: "regex",
        symbols: entities.map((name) => ({
          name,
          kind: "unknown",
          isExported: false,
          range: { startIndex: 0, endIndex: 0, startRow: 0, startColumn: 0, endRow: 0, endColumn: 0 },
        })),
        primarySymbol: entities.length > 0
          ? {
              name: entities[0],
              kind: "unknown",
              isExported: false,
              range: { startIndex: 0, endIndex: 0, startRow: 0, startColumn: 0, endRow: 0, endColumn: 0 },
            }
          : undefined,
      },
    };
  }

  try {
    const parser = new Parser();
    parser.setLanguage(lang);

    const tree = parser.parse(source);
    if (!tree) {
      throw new Error("[MemoHub] Tree-sitter 解析返回空树（可能是未设置语言或解析被取消）");
    }
    const root = tree.rootNode;
    const symbols = collectSymbolsFromAst(root);
    const primarySymbol = pickPrimarySymbol(symbols);

    const entities = Array.from(
      new Set(symbols.map((s) => s.name).filter((name) => String(name ?? "").trim() !== ""))
    );

    return {
      entities,
      metadata: {
        language: languageId,
        parseEngine: "tree-sitter",
        symbols,
        primarySymbol,
      },
    };
  } catch (error) {
    console.error("[MemoHub] Tree-sitter 解析失败，将回退到正则:", error);
    const entities = extractEntitiesFromCodeRegex(source);
    return {
      entities,
      metadata: {
        language: languageId,
        parseEngine: "regex",
        symbols: entities.map((name) => ({
          name,
          kind: "unknown",
          isExported: false,
          range: { startIndex: 0, endIndex: 0, startRow: 0, startColumn: 0, endRow: 0, endColumn: 0 },
        })),
        primarySymbol: entities.length > 0
          ? {
              name: entities[0],
              kind: "unknown",
              isExported: false,
              range: { startIndex: 0, endIndex: 0, startRow: 0, startColumn: 0, endRow: 0, endColumn: 0 },
            }
          : undefined,
      },
    };
  }
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
