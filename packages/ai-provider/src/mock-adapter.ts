import type { IEmbedder, ICompleter, ChatMessage } from "./types.js";

export class MockAdapter implements IEmbedder, ICompleter {
  async embed(text: string): Promise<number[]> {
    return Array(768)
      .fill(0)
      .map(() => Math.random());
  }

  async batchEmbed(texts: string[]): Promise<number[][]> {
    return texts.map(() =>
      Array(768)
        .fill(0)
        .map(() => Math.random()),
    );
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    return "2,0,1"; // Standard mock response for reranker tests
  }

  async summarize(text: string): Promise<string> {
    return "Mock summary";
  }
}
