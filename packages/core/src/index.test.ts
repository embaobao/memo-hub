import { describe, test, expect, beforeEach } from 'bun:test';
import { MemoryKernel } from './kernel.js';
import { MockEmbedder, MockCompleter, MockCAS, MockVectorStorage } from './mocks.js';
import { MemoOp } from '@memohub/protocol';

describe('MemoryKernel Config-Driven Dispatch', () => {
  let kernel: MemoryKernel;

  const createKernel = () => {
    return new MemoryKernel({
      version: '1.0.0',
      system: { root: '/tmp/test', trace_enabled: true, log_level: 'info' },
      ai: {
        providers: [{ id: 'test', type: 'mock' }],
        agents: { 
            embedder: { provider: 'test', model: 'mock' },
            summarizer: { provider: 'test', model: 'mock' }
        }
      },
      dispatcher: { fallback: 'track-test' },
      tracks: [
        {
          id: 'track-test',
          flows: {
            ADD: [
              { step: 'test-step', tool: 'builtin:cas', input: { content: '$.payload.text' } }
            ]
          }
        }
      ]
    } as any);
  };

  beforeEach(() => {
    kernel = createKernel();
    kernel.setComponents({
      embedder: new MockEmbedder(),
      completer: new MockCompleter(),
      cas: new MockCAS(),
      vector: new MockVectorStorage()
    });
  });

  test('dispatches instruction to configured flow', async () => {
    const result = await kernel.dispatch({
      op: MemoOp.ADD,
      trackId: 'track-test',
      payload: { text: 'hello' },
    });
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  test('returns error for unregistered flow/track', async () => {
    const result = await kernel.dispatch({
      op: MemoOp.RETRIEVE, // Not defined in mock track
      trackId: 'track-test',
      payload: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('未定义操作');
  });

  test('returns error for unregistered track', async () => {
    const result = await kernel.dispatch({
      op: MemoOp.ADD,
      trackId: 'unknown',
      payload: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('轨道定义不存在');
  });
});
