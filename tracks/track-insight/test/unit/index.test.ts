import { describe, it, expect, beforeEach } from 'vitest';
import { InsightTrack } from '../../src/index.ts';
import { MemoOp, IKernel, ITool } from '@memohub/protocol';
import { MockCAS, MockVectorStorage, MockEmbedder } from '../../../../packages/core/src/mocks.ts';
import { CasTool, VectorTool, EmbedderTool, RetrieverTool, EntityLinkerTool } from '../../../../packages/builtin-tools/src/index.ts';

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
    this.registerTool(new EntityLinkerTool());
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
    const t = this.tools.get(id);
    if (!t) throw new Error(`Tool not found: ${id}`);
    
    // Mock the execute context to provide resources
    const originalExecute = t.execute.bind(t);
    t.execute = async (input, resources, context) => {
      const mockResources = {
        kernel: this,
        flesh: this.cas,
        soul: this.vector,
        ai: { getEmbedder: () => this.embedder, getCompleter: () => null },
        logger: { log: () => {} }
      };
      return originalExecute(input, mockResources, context);
    };
    return t;
  }
  
  listTools() { return Array.from(this.tools.values()).map(t => t.manifest); }
  async dispatch() { return { success: true }; }
}

describe('InsightTrack', () => {
  let track: InsightTrack;
  let kernel: MockKernel;

  beforeEach(async () => {
    kernel = new MockKernel();
    track = new InsightTrack();
    await track.initialize(kernel);
  });

  it('should ADD a memory and return id and hash', async () => {
    const text = 'MemoHub is an awesome memory OS.';
    const result = await track.execute({
      op: MemoOp.ADD,
      trackId: track.id,
      payload: { text, category: 'test' }
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('id');
    expect(result.data).toHaveProperty('hash');

    // Expected Hash from MockCAS is "hash-length"
    expect(result.data.hash).toBe(`hash-${text.length}`);
  });

  it('should RETRIEVE a memory with hydration', async () => {
    // First add
    const text = 'Retrieve test memory.';
    await track.execute({
      op: MemoOp.ADD,
      trackId: track.id,
      payload: { text }
    });

    // Then retrieve
    const result = await track.execute({
      op: MemoOp.RETRIEVE,
      trackId: track.id,
      payload: { query: 'test', limit: 1 }
    });

    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBe(1);
    
    // The RetrieverTool should hydrate the text
    expect(result.data[0]).toHaveProperty('text', text);
    expect(result.data[0]).toHaveProperty('hash', `hash-${text.length}`);
  });
});
