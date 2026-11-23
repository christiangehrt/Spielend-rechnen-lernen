import { describe, expect, it } from 'vitest';
import { createGame, currentTask, firstTryCorrect, generateTasks, PRESETS, reduce, scatterPositions } from './engine';
import type { BbState } from './types';

const answer = (s: BbState, n: number) => reduce(reduce(s, { type: 'SHOWN' }), { type: 'ANSWER', n });

describe('Blitzblick', () => {
  it('creates 10 tasks in range without direct repetition', () => {
    for (let seed = 1; seed < 100; seed++) {
      const tasks = generateTasks(PRESETS.bis10, seed);
      expect(tasks).toHaveLength(10);
      tasks.forEach((t, i) => {
        expect(t.n).toBeGreaterThanOrEqual(1);
        expect(t.n).toBeLessThanOrEqual(10);
        if (i > 0) expect(t.n).not.toBe(tasks[i - 1].n);
        if (t.pattern === 'dice') expect(t.n).toBeLessThanOrEqual(6);
        if (t.pattern === 'scatter') expect(t.n).toBeLessThanOrEqual(4);
      });
    }
    generateTasks(PRESETS.bis20, 3).forEach((t) => expect(t.n).toBeGreaterThanOrEqual(6));
  });

  it('flash → answer → feedback → next', () => {
    let s = createGame('bis10', 5);
    expect(s.phase).toBe('show');
    expect(reduce(s, { type: 'ANSWER', n: 1 })).toBe(s); // not while flashing
    s = answer(s, currentTask(s).n);
    expect(s.phase).toBe('feedback');
    expect(s.answers[0].correct).toBe(true);
    s = reduce(s, { type: 'NEXT' });
    expect(s.index).toBe(1);
    expect(s.phase).toBe('show');
  });

  it('a wrong answer slows down, stays on the task and is not first-try correct', () => {
    let s = createGame('bis10', 5);
    const n = currentTask(s).n;
    s = answer(s, n === 1 ? 2 : 1);
    expect(s.phase).toBe('answer');
    expect(s.showMs).toBe(PRESETS.bis10.showMs + 400);
    s = reduce(s, { type: 'ANSWER', n });
    expect(s.phase).toBe('feedback');
    expect(s.answers[0].correct).toBe(false);
  });

  it('gets faster after two right answers in a row, never below the minimum', () => {
    let s = createGame('bis10', 9);
    for (let i = 0; i < 10; i++) {
      s = answer(s, currentTask(s).n);
      s = reduce(s, { type: 'NEXT' });
    }
    expect(s.phase).toBe('over');
    expect(firstTryCorrect(s)).toBe(10);
    expect(s.showMs).toBeLessThan(PRESETS.bis10.showMs);
    expect(s.showMs).toBeGreaterThanOrEqual(PRESETS.bis10.minMs);
  });

  it('looking again counts as help', () => {
    let s = reduce(createGame('bis5', 2), { type: 'SHOWN' });
    s = reduce(s, { type: 'PEEK' });
    expect(s.phase).toBe('show');
    s = answer(s, currentTask(s).n);
    expect(s.answers[0].correct).toBe(false);
  });

  it('scatters dots without overlap', () => {
    const pts = scatterPositions(4, 77);
    expect(pts).toHaveLength(4);
    for (const a of pts) for (const b of pts) if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(26);
  });
});
