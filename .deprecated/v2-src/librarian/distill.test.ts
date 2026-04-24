import { describe, expect, test } from "bun:test";
import { distillSessionTextToFacts } from "./distill.js";

describe("Librarian - distillSessionTextToFacts（占位蒸馏器）", () => {
  test("空输入返回空数组", () => {
    expect(distillSessionTextToFacts("")).toEqual([]);
    expect(distillSessionTextToFacts("   ")).toEqual([]);
  });

  test("优先抽取结论/决定/规则等强信号", () => {
    const text = `
      2026-04-20 10:00:00 结论：本次只做骨架，不接入外部模型
      TODO: 补充 post-commit hook
      - 处理幂等键
      其它随便一行
    `;

    const facts = distillSessionTextToFacts(text, { maxFacts: 10 });
    expect(facts[0]).toContain("结论");
    expect(facts.some((f) => /TODO/i.test(f))).toBe(true);
  });

  test("无强信号时回退为若干行短事实", () => {
    const text = `
      第一行普通描述
      第二行普通描述
      第三行普通描述
    `;

    const facts = distillSessionTextToFacts(text, { maxFacts: 2 });
    expect(facts.length).toBe(2);
    expect(facts[0]).toBe("第一行普通描述");
  });
});

