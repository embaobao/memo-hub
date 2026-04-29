import { describe, it, expect } from "bun:test";
import { AIProviderRegistry } from "../../src/registry.js";
import { AIProviderError } from "../../src/types.js";
import type { IEmbedder } from "../../src/types.js";

const mockEmbedder: IEmbedder = {
  embed: async () => [1, 2, 3],
  batchEmbed: async (texts) => texts.map(() => [1, 2, 3]),
};

describe("AIProviderRegistry", () => {
  it("registers and retrieves embedder", () => {
    const registry = new AIProviderRegistry();
    registry.registerEmbedder("mock", () => mockEmbedder);
    const embedder = registry.getEmbedder("mock");
    expect(embedder).toBe(mockEmbedder);
  });

  it("throws for unregistered adapter", () => {
    const registry = new AIProviderRegistry();
    expect(() => registry.getEmbedder("nonexistent")).toThrow("not registered");
  });

  it("caches instances", () => {
    const registry = new AIProviderRegistry();
    let callCount = 0;
    registry.registerEmbedder("cached", () => {
      callCount++;
      return mockEmbedder;
    });
    registry.getEmbedder("cached");
    registry.getEmbedder("cached");
    expect(callCount).toBe(1);
  });
});

describe("AIProviderError", () => {
  it("includes provider name", () => {
    const err = new AIProviderError("test", "ollama");
    expect(err.name).toBe("AIProviderError");
    expect(err.provider).toBe("ollama");
    expect(err.message).toBe("test");
  });
});
