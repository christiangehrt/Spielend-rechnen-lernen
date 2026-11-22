import { describe, expect, it } from 'vitest';
import { canUseOneDie, createGame, hint, penalty, reduce, target } from './engine';
import type { KlappenState } from './types';

const rolled = (open: number[], dice: number[], extra: Partial<KlappenState> = {}): KlappenState => ({
  ...createGame('klappen9', 1),
  open,
  dice,
  phase: 'select',
  ...extra,
});

/** Find a seed whose next roll of n dice gives the wanted total. */
const seedFor = (base: KlappenState, n: 1 | 2, total: number) => {
  for (let seed = 1; seed < 10000; seed++) {
    const s = reduce({ ...base, rngSeed: seed }, { type: 'ROLL', diceCount: n });
    if (s.dice && target(s) === total) return seed;
  }
  throw new Error('no seed');
};

describe('Klappen zu! setup', () => {
  it('starts with flaps 1–9 open and two dice', () => {
    const s = createGame('klappen9', 7);
    expect(s.open).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(s.phase).toBe('roll');
    expect(canUseOneDie(s)).toBe(false);
    expect(reduce(s, { type: 'ROLL', diceCount: 1 })).toBe(s);
  });

  it('rolls two dice with values 1–6', () => {
    let s = createGame('klappen9', 3);
    for (let i = 0; i < 50; i++) {
      s = reduce({ ...s, phase: 'roll' }, { type: 'ROLL', diceCount: 2 });
      expect(s.dice).toHaveLength(2);
      s.dice!.forEach((d) => expect(d >= 1 && d <= 6).toBe(true));
    }
  });
});

describe('subset-sum end detection', () => {
  it('ends the round at once if the roll cannot be formed (open 2,4,6, roll 5)', () => {
    const base: KlappenState = { ...createGame('klappen9', 1), open: [2, 4, 6] };
    const seed = seedFor(base, 2, 5);
    const s = reduce({ ...base, rngSeed: seed }, { type: 'ROLL', diceCount: 2 });
    expect(s.phase).toBe('over');
    expect(penalty(s)).toBe(12);
  });

  it('continues when the sum can be formed', () => {
    const base: KlappenState = { ...createGame('klappen9', 1), open: [2, 4, 6] };
    const seed = seedFor(base, 2, 10);
    expect(reduce({ ...base, rngSeed: seed }, { type: 'ROLL', diceCount: 2 }).phase).toBe('select');
  });
});

describe('one-die option', () => {
  it('unlocks exactly when all flaps above 6 are shut', () => {
    const s = createGame('klappen9', 1);
    expect(canUseOneDie({ ...s, open: [1, 2, 3, 7] })).toBe(false);
    expect(canUseOneDie({ ...s, open: [1, 2, 3, 6] })).toBe(true);
    const r = reduce({ ...s, open: [1, 4, 6] }, { type: 'ROLL', diceCount: 1 });
    expect(r.dice).toHaveLength(1);
  });

  it('respects flaps 7–12 in the 12-flap preset', () => {
    const s = createGame('klappen12', 1);
    expect(canUseOneDie({ ...s, open: [3, 12] })).toBe(false);
    expect(canUseOneDie({ ...s, open: [3, 5] })).toBe(true);
  });

  it('always uses one die in the mini preset', () => {
    const s = createGame('klappen6', 1);
    expect(canUseOneDie(s)).toBe(true);
    expect(reduce(s, { type: 'ROLL', diceCount: 2 })).toBe(s);
    expect(reduce(s, { type: 'ROLL', diceCount: 1 }).dice).toHaveLength(1);
  });
});

describe('selecting and closing flaps', () => {
  it('tracks the partial sum and rejects overshooting', () => {
    let s = rolled([1, 2, 3, 4, 5, 6, 7, 8, 9], [3, 5]);
    s = reduce(s, { type: 'TOGGLE', value: 5 });
    expect(s.selected).toEqual([5]);
    expect(reduce(s, { type: 'TOGGLE', value: 4 })).toBe(s); // 5 + 4 > 8
    s = reduce(s, { type: 'TOGGLE', value: 3 });
    expect(s.selected).toEqual([5, 3]);
    s = reduce(s, { type: 'CONFIRM' });
    expect(s.open).toEqual([1, 2, 4, 6, 7, 8, 9]);
    expect(s.lastClosed).toEqual([5, 3]);
    expect(s.phase).toBe('roll');
  });

  it('only confirms an exact sum', () => {
    const s = reduce(rolled([1, 2, 3, 9], [4, 6]), { type: 'TOGGLE', value: 9 });
    expect(reduce(s, { type: 'CONFIRM' })).toBe(s);
  });

  it('counts 3+ flap moves as multi-split strategy', () => {
    let s = rolled([1, 2, 5, 9], [4, 4]);
    for (const v of [1, 2, 5]) s = reduce(s, { type: 'TOGGLE', value: v });
    s = reduce(s, { type: 'CONFIRM' });
    expect(s.stats.multiSplits).toBe(1);
  });

  it('wins with 0 points when every flap is shut', () => {
    let s = rolled([4, 6], [5, 5]);
    s = reduce(reduce(s, { type: 'TOGGLE', value: 4 }), { type: 'TOGGLE', value: 6 });
    s = reduce(s, { type: 'CONFIRM' });
    expect(s.phase).toBe('over');
    expect(penalty(s)).toBe(0);
  });
});

describe('undo & hint', () => {
  it('undoes only unconfirmed selections', () => {
    let s = rolled([1, 2, 3, 9], [6, 6]);
    s = reduce(reduce(s, { type: 'TOGGLE', value: 9 }), { type: 'TOGGLE', value: 3 });
    s = reduce(s, { type: 'UNDO' });
    expect(s.selected).toEqual([9]);
    s = reduce(reduce(s, { type: 'TOGGLE', value: 3 }), { type: 'CONFIRM' });
    expect(reduce(s, { type: 'UNDO' })).toBe(s);
  });

  it('suggests a valid combination for the rest of the sum', () => {
    const s = reduce(rolled([1, 2, 3, 4, 9], [5, 5]), { type: 'TOGGLE', value: 1 });
    const h = hint(s)!;
    expect(h.reduce((a, b) => a + b, 0)).toBe(9);
    expect(h).not.toContain(1);
  });
});
