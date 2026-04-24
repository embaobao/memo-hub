import { expect, test, describe } from "bun:test";
import { VariableResolver } from "./resolver.js";

describe("VariableResolver", () => {
  const resolver = new VariableResolver();
  const state = {
    payload: {
      id: "p1",
      text: "hello world",
      meta: { cat: "test" }
    },
    nodes: {
      step1: {
        hash: "abc-123",
        data: { vector: [1, 2, 3] }
      }
    }
  };

  test("should resolve simple payload paths", () => {
    expect(resolver.resolve("{{payload.id}}", state)).toBe("p1");
    expect(resolver.resolve("{{payload.meta.cat}}", state)).toBe("test");
  });

  test("should resolve node paths", () => {
    expect(resolver.resolve("{{nodes.step1.hash}}", state)).toBe("abc-123");
    expect(resolver.resolve("{{nodes.step1.data.vector}}", state)).toEqual([1, 2, 3]);
  });

  test("should resolve complex objects", () => {
    const input = {
      id: "{{payload.id}}",
      details: {
        source: "{{nodes.step1.hash}}",
        tags: ["{{payload.meta.cat}}", "constant"]
      }
    };
    const expected = {
      id: "p1",
      details: {
        source: "abc-123",
        tags: ["test", "constant"]
      }
    };
    expect(resolver.resolve(input, state)).toEqual(expected);
  });

  test("should handle inline interpolation", () => {
    expect(resolver.resolve("ID is {{payload.id}}", state)).toBe("ID is p1");
  });

  test("should return original if no match", () => {
    expect(resolver.resolve("constant", state)).toBe("constant");
    expect(resolver.resolve("{{missing}}", state)).toBeUndefined();
  });
});
