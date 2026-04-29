import { describe, it, expect, beforeEach } from 'vitest';
import { WikiTrack } from '../../src/index.ts';
import { MemoOp, IKernel, ITool } from '@memohub/protocol';
import { MockCAS, MockVectorStorage, MockEmbedder } from '../../../../packages/core/src/mocks.ts';
import { CasTool, VectorTool, EmbedderTool, RetrieverTool } from '../../../../packages/builtin-tools/src/index.ts';

class MockKernel implements IKernel {
  cas = new MockCAS();
  vector = new MockVectorStorage();
  embedder = new MockEmbedder();
  tools = new Map<string, ITool>();

  constructor() {
    this.registerTool(new CasTool());
    this.registerTool(new VectorTool());
    this.registerTool(new EmbedderTool());
    this.registerTool(new RetrieverTool());
  }

  registerTool(tool: ITool) {
    this.tools.set(tool.manifest.id, tool);
  }

  getCAS() { return this.cas; }
  getVectorStorage() { return this.vector; }
  getEmbedder() { return this.embedder; }
  getCompleter() { return null; }
  getConfig() { return { system: { root: '/tmp' }, ai: { agents: {} } }; }
  getResources() {
    return {
      kernel: this,
      flesh: this.cas,
      soul: this.vector,
      ai: { getEmbedder: () => this.embedder, getCompleter: () => null },
      logger: { log: () => {} }
    };
  }
  
  getTool(id: string): ITool {
    const tool = this.tools.get(id);
    if (!tool) throw new Error(`Tool not found: ${id}`);
    return tool;
  }
  listTools() { return Array.from(this.tools.values()).map(t => t.manifest); }
  async dispatch() { return { success: true } as any; }
}

describe('WikiTrack', () => {
  let track: WikiTrack;
  let kernel: MockKernel;

  beforeEach(async () => {
    kernel = new MockKernel();
    track = new WikiTrack();
    await track.initialize(kernel);
  });

  it('should ADD a wiki entry', async () => {
    const title = 'Core Concepts';
    const content = 'MemoHub is great.';
    const result = await track.execute({
      op: MemoOp.ADD,
      trackId: track.id,
      payload: { title, content }
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('id');
    expect(result.data).toHaveProperty('hash');
    expect(result.data.hash).toBe(`hash-${content.length}`);
  });

  it('should fail ADD if missing title or content', async () => {
    const result = await track.execute({
      op: MemoOp.ADD,
      trackId: track.id,
      payload: { title: 'Missing content' }
    });

    expect(result.success).toBe(false);
    expect(result.error).toHaveProperty('code');
  });

  it('should RETRIEVE wiki entry with hydration', async () => {
    const title = 'Retrieval Test';
    const content = 'Test content';
    await track.execute({
      op: MemoOp.ADD,
      trackId: track.id,
      payload: { title, content }
    });

    const result = await track.execute({
      op: MemoOp.RETRIEVE,
      trackId: track.id,
      payload: { query: 'test' }
    });

    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data[0]).toHaveProperty('text', content);
  });
});
