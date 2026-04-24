import { describe, expect, test } from "bun:test";
import { extractCodeEntitiesAndMetadata } from "./utils.js";

describe("utils：Tree-sitter AST 实体/符号抽取（TS/JS）", () => {
  test("TypeScript：可提取 interface/type/class/function/const 等符号，并标记导出", async () => {
    const code = `
export interface Foo { a: string }
export type Bar = { b: number }
export enum Kind { A = 1 }
export class Baz {}
export function qux() {}
export const quux = () => 1
const internal = 2
`;

    const { entities, metadata } = await extractCodeEntitiesAndMetadata(code, "typescript");

    expect(metadata.parseEngine).toBe("tree-sitter");

    // entities：用于“实体纽带”，只关心符号名去重结果
    expect(entities).toEqual(
      expect.arrayContaining(["Foo", "Bar", "Kind", "Baz", "qux", "quux", "internal"])
    );

    const symbolMap = new Map(metadata.symbols.map((s) => [s.name, s]));
    expect(symbolMap.get("Foo")?.kind).toBe("interface");
    expect(symbolMap.get("Foo")?.isExported).toBe(true);
    expect(symbolMap.get("Bar")?.kind).toBe("type");
    expect(symbolMap.get("Baz")?.kind).toBe("class");
    expect(symbolMap.get("qux")?.kind).toBe("function");
    expect(symbolMap.get("quux")?.kind).toBe("variable");
    expect(symbolMap.get("internal")?.isExported).toBe(false);

    // primarySymbol：默认优先导出符号
    expect(metadata.primarySymbol?.isExported).toBe(true);
    expect(metadata.primarySymbol?.name.length).toBeGreaterThan(0);
  });

  test("JavaScript：可提取导出函数与变量", async () => {
    const code = `
export function hello() {}
export const world = function () {}
const local = 1
`;

    const { entities, metadata } = await extractCodeEntitiesAndMetadata(code, "javascript");
    expect(metadata.parseEngine).toBe("tree-sitter");
    expect(entities).toEqual(expect.arrayContaining(["hello", "world", "local"]));

    const symbolMap = new Map(metadata.symbols.map((s) => [s.name, s]));
    expect(symbolMap.get("hello")?.kind).toBe("function");
    expect(symbolMap.get("hello")?.isExported).toBe(true);
    expect(symbolMap.get("world")?.kind).toBe("variable");
    expect(symbolMap.get("world")?.isExported).toBe(true);
  });

  test("未知语言：回退到正则抽取（保持能力不退化）", async () => {
    const code = `
export function f1() {}
class C1 {}
`;

    const { entities, metadata } = await extractCodeEntitiesAndMetadata(code, "python");
    expect(metadata.parseEngine).toBe("regex");
    expect(entities).toEqual(expect.arrayContaining(["f1", "C1"]));
  });
});
