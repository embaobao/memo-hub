import { describe, it, expect } from 'bun:test';
import { MemoOp, validateInstruction } from './index.js';

const ALL_OPS = Object.values(MemoOp);

describe('MemoOp', () => {
  it('contains all 12 operations', () => {
    expect(ALL_OPS).toHaveLength(12);
    expect(ALL_OPS).toContain(MemoOp.ADD);
    expect(ALL_OPS).toContain(MemoOp.RETRIEVE);
    expect(ALL_OPS).toContain(MemoOp.UPDATE);
    expect(ALL_OPS).toContain(MemoOp.DELETE);
    expect(ALL_OPS).toContain(MemoOp.MERGE);
    expect(ALL_OPS).toContain(MemoOp.CLARIFY);
    expect(ALL_OPS).toContain(MemoOp.LIST);
    expect(ALL_OPS).toContain(MemoOp.EXPORT);
    expect(ALL_OPS).toContain(MemoOp.DISTILL);
    expect(ALL_OPS).toContain(MemoOp.ANCHOR);
    expect(ALL_OPS).toContain(MemoOp.DIFF);
    expect(ALL_OPS).toContain(MemoOp.SYNC);
  });
});

describe('validateInstruction', () => {
  it('validates a correct instruction', () => {
    const result = validateInstruction({
      op: MemoOp.ADD,
      trackId: 'track-insight',
      payload: { text: 'hello' },
    });
    expect(result.success).toBe(true);
    expect(result.data?.op).toBe(MemoOp.ADD);
    expect(result.data?.trackId).toBe('track-insight');
  });

  it('rejects invalid operation', () => {
    const result = validateInstruction({
      op: 'INVALID' as any,
      trackId: 'track-insight',
      payload: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects missing fields', () => {
    const result = validateInstruction({ op: MemoOp.ADD });
    expect(result.success).toBe(false);
    expect(result.error).toContain('trackId');
  });

  it('accepts optional context and meta', () => {
    const result = validateInstruction({
      op: MemoOp.RETRIEVE,
      trackId: 'track-source',
      payload: { query: 'test' },
      context: { sessionId: 'abc' },
      meta: { timestamp: Date.now() },
    });
    expect(result.success).toBe(true);
    expect(result.data?.context).toEqual({ sessionId: 'abc' });
    expect(result.data?.meta).toBeDefined();
  });
});
