import { describe, expect, it } from 'vitest';
import { checkJump, createGame, crossesTen, generateTasks, goal, lineWindow, reduce, remaining } from './engine';
import { PRESETS } from './presets';
import type { ZhState } from './types';

const at = (start: number, amount: number, presetId: keyof typeof PRESETS = 'plus20'): ZhState => {
  const s = createGame(presetId, 1);
  return { ...s, tasks: [{ start, amount }, { start: 3, amount: 2 }], taskIndex: 0, position: start, jumps: [], results: [] };
};

describe('task generation', () => {
  it('creates 6 tasks inside 0–20; tasks 2–6 cross the ten', () => {
    for (let seed = 1; seed < 200; seed++) {
      const tasks = generateTasks(PRESETS.plus20, seed);
      expect(tasks).toHaveLength(6);
      tasks.forEach((t, i) => {
        const g = t.start + t.amount;
        expect(g).toBeLessThanOrEqual(20);
        expect(crossesTen(PRESETS.plus20, t)).toBe(i > 0);
      });
    }
  });

  it('creates subtraction tasks that cross the ten downwards', () => {
    for (let seed = 1; seed < 100; seed++) {
      const tasks = generateTasks(PRESETS.minus20, seed);
      tasks.slice(1).forEach((t) => {
        expect(t.start).toBeGreaterThan(10);
        expect(t.start - t.amount).toBeLessThan(10);
        expect(t.start - t.amount).toBeGreaterThan(0);
      });
    }
  });

  it('keeps ZR 100 tasks within a 20-wide window', () => {
    for (let seed = 1; seed < 100; seed++) {
      const s = createGame('plus100', seed);
      const [from, to] = lineWindow(s);
      const t = s.tasks[0];
      expect(to - from).toBe(20);
      expect(t.start).toBeGreaterThanOrEqual(from);
      expect(t.start + t.amount).toBeLessThanOrEqual(to);
    }
  });
});

describe('jumping (7 + 6)', () => {
  it('solves via the ten-bridge: 7 → 10 → 13', () => {
    let s = at(7, 6);
    expect(goal(s)).toBe(13);
    s = reduce(s, { type: 'JUMP', to: 10 });
    expect(remaining(s)).toBe(3);
    s = reduce(s, { type: 'JUMP', to: 13 });
    expect(s.phase).toBe('taskDone');
    expect(s.results[0]).toEqual({ crossesTen: true, bridged: true, jumps: 2 });
  });

  it('allows a direct jump but gives no bridge bonus', () => {
    const s = reduce(at(7, 6), { type: 'JUMP', to: 13 });
    expect(s.results[0].bridged).toBe(false);
  });

  it('blocks single trippel steps except onto a ten or as the last step', () => {
    expect(checkJump(at(7, 6), 8)).toBe('tinyStep');
    expect(checkJump(at(9, 4), 10)).toBe('ok');
    let s = reduce(at(7, 6), { type: 'JUMP', to: 12 });
    expect(checkJump(s, 13)).toBe('ok');
    s = reduce(s, { type: 'JUMP', to: 13 });
    expect(s.phase).toBe('taskDone');
  });

  it('rejects jumps that are too far or backwards', () => {
    expect(checkJump(at(7, 6), 14)).toBe('tooFar');
    expect(checkJump(at(7, 6), 5)).toBe('wrongDirection');
    expect(checkJump(at(7, 6), 7)).toBe('wrongDirection');
    expect(reduce(at(7, 6), { type: 'JUMP', to: 14 }).position).toBe(7);
  });

  it('works backwards for subtraction (13 − 5 → 10 → 8)', () => {
    let s = at(13, 5, 'minus20');
    expect(checkJump(s, 15)).toBe('wrongDirection');
    s = reduce(reduce(s, { type: 'JUMP', to: 10 }), { type: 'JUMP', to: 8 });
    expect(s.results[0].bridged).toBe(true);
  });
});

describe('flow & undo', () => {
  it('undoes the last jump of the current task', () => {
    let s = reduce(at(7, 6), { type: 'JUMP', to: 10 });
    s = reduce(s, { type: 'UNDO' });
    expect(s.position).toBe(7);
    expect(s.jumps).toEqual([]);
  });

  it('moves to the next task and ends after the last one', () => {
    let s = reduce(at(7, 6), { type: 'JUMP', to: 13 });
    s = reduce(s, { type: 'NEXT_TASK' });
    expect(s.taskIndex).toBe(1);
    expect(s.position).toBe(3);
    s = reduce(s, { type: 'JUMP', to: 5 });
    s = reduce(s, { type: 'NEXT_TASK' });
    expect(s.phase).toBe('over');
  });
});
