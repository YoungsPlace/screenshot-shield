import { describe, expect, it } from 'vitest';
import { createHistory, pushHistory, redoHistory, undoHistory } from '../src/domain/history';

describe('createHistory', () => {
  it('creates a state with no past or future', () => {
    const h = createHistory(42);
    expect(h.present).toBe(42);
    expect(h.past).toHaveLength(0);
    expect(h.future).toHaveLength(0);
  });
});

describe('pushHistory', () => {
  it('moves present to past and sets new present', () => {
    const h = createHistory('a');
    const h2 = pushHistory(h, 'b');
    expect(h2.present).toBe('b');
    expect(h2.past).toEqual(['a']);
    expect(h2.future).toHaveLength(0);
  });

  it('clears future on push', () => {
    const h = createHistory('a');
    const h2 = pushHistory(h, 'b');
    const h3 = undoHistory(h2);
    const h4 = pushHistory(h3, 'c');
    expect(h4.future).toHaveLength(0);
  });

  it('caps past at 80 entries', () => {
    let h = createHistory(0);
    for (let i = 1; i <= 90; i++) h = pushHistory(h, i);
    expect(h.past.length).toBeLessThanOrEqual(80);
  });
});

describe('undoHistory', () => {
  it('restores the previous present and moves current to future', () => {
    const h = createHistory('a');
    const h2 = pushHistory(h, 'b');
    const h3 = undoHistory(h2);
    expect(h3.present).toBe('a');
    expect(h3.future).toEqual(['b']);
    expect(h3.past).toHaveLength(0);
  });

  it('is a no-op when past is empty', () => {
    const h = createHistory('only');
    const h2 = undoHistory(h);
    expect(h2).toBe(h);
  });

  it('undoes multiple steps in sequence', () => {
    const h0 = createHistory('a');
    const h1 = pushHistory(h0, 'b');
    const h2 = pushHistory(h1, 'c');
    const h3 = undoHistory(h2);
    const h4 = undoHistory(h3);
    expect(h4.present).toBe('a');
    expect(h4.past).toHaveLength(0);
    expect(h4.future).toEqual(['b', 'c']);
  });
});

describe('redoHistory', () => {
  it('moves the first future item back to present', () => {
    const h = createHistory('a');
    const h2 = pushHistory(h, 'b');
    const h3 = undoHistory(h2);
    const h4 = redoHistory(h3);
    expect(h4.present).toBe('b');
    expect(h4.past).toEqual(['a']);
    expect(h4.future).toHaveLength(0);
  });

  it('is a no-op when future is empty', () => {
    const h = createHistory('only');
    const h2 = redoHistory(h);
    expect(h2).toBe(h);
  });

  it('redoes multiple steps in sequence', () => {
    const h0 = createHistory('a');
    const h1 = pushHistory(h0, 'b');
    const h2 = pushHistory(h1, 'c');
    // undo twice
    const h3 = undoHistory(undoHistory(h2));
    // redo twice
    const h4 = redoHistory(redoHistory(h3));
    expect(h4.present).toBe('c');
    expect(h4.future).toHaveLength(0);
  });
});
