import type {
  IEmbedder,
  ICompleter,
  ICAS,
  IVectorStorage,
  Text2MemResult,
} from "@memohub/protocol";

export class MockEmbedder implements IEmbedder {
  async embed(text: string): Promise<number[]> {
    return new Array(768).fill(0).map(() => Math.random());
  }
  async batchEmbed(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.embed(t)));
  }
}

export class MockCompleter implements ICompleter {
  async chat(messages: any[]): Promise<string> {
    return "Mock chat response";
  }
  async summarize(text: string): Promise<string> {
    return `Summarized: ${text.slice(0, 20)}...`;
  }
}

export class MockCAS implements ICAS {
  private storage = new Map<string, string>();
  async write(content: string): Promise<string> {
    const hash = this.computeHash(content);
    this.storage.set(hash, content);
    return hash;
  }
  async read(hash: string): Promise<string> {
    const content = this.storage.get(hash);
    if (!content) throw new Error("Hash not found");
    return content;
  }
  async has(hash: string): Promise<boolean> {
    return this.storage.has(hash);
  }
  async delete(hash: string): Promise<void> {
    this.storage.delete(hash);
  }
  computeHash(content: string): string {
    return `hash-${content.length}`;
  }
}

export class MockVectorStorage implements IVectorStorage {
  private records: any[] = [];
  async add(records: any | any[]): Promise<void> {
    if (Array.isArray(records)) this.records.push(...records);
    else this.records.push(records);
  }
  async search(vector: number[], options?: any): Promise<any[]> {
    let res = this.records;
    if (options?.filter) {
      // Very simple filter simulator (track_id = 'xxx')
      const match = options.filter.match(/track_id = '([^']+)'/);
      if (match) res = res.filter((r) => r.track_id === match[1]);
    }
    return res
      .slice(0, options?.limit ?? 5)
      .map((r) => ({ ...r, _distance: 0.1 }));
  }
  async delete(filter: string): Promise<void> {
    this.records = []; // simple clear for mock
  }
  async list(filter?: string, limit?: number): Promise<any[]> {
    return this.records.slice(0, limit);
  }
  async update(id: string, changes: any): Promise<void> {
    const r = this.records.find((r) => r.id === id);
    if (r) Object.assign(r, changes);
  }
  async initialize(): Promise<void> {}
}
