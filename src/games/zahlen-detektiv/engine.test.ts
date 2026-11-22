import { describe, expect, it } from 'vitest';
import { answerFor, candidates, createGame, isCandidate, isGoodSplit, reduce, totalQuestions } from './engine';
import type { ZdState } from './types';

const withSecret = (secret: number): ZdState => {
  const s = createGame('bis20', 1);
  return { ...s, cases: [{ secret, questions: [] }, { secret: 3, questions: [] }] };
};

const ask = (s: ZdState, kind: 'gt' | 'lt' | 'between' | 'exact', a: number, b?: number) => {
  let n = reduce(s, { type: 'SET_KIND', kind });
  n = reduce(n, { type: 'PICK', n: a });
  if (b !== undefined) n = reduce(n, { type: 'PICK', n: b });
  return reduce(n, { type: 'ASK' });
};

describe('Zahlen-Detektiv', () => {
  it('creates distinct secrets within the range', () => {
    for (let seed = 1; seed < 100; seed++) {
      const s = createGame('bis20', seed);
      const secrets = s.cases.map((c) => c.secret);
      expect(new Set(secrets).size).toBe(secrets.length);
      secrets.forEach((x) => expect(x >= 1 && x <= 20).toBe(true));
    }
  });

  it('answers the four question types', () => {
    expect(answerFor({ kind: 'gt', a: 7 }, 9)).toBe(true);
    expect(answerFor({ kind: 'gt', a: 9 }, 9)).toBe(false);
    expect(answerFor({ kind: 'lt', a: 9 }, 8)).toBe(true);
    expect(answerFor({ kind: 'between', a: 5, b: 10 }, 10)).toBe(true);
    expect(answerFor({ kind: 'between', a: 5, b: 10 }, 11)).toBe(false);
    expect(answerFor({ kind: 'exact', a: 4 }, 4)).toBe(true);
  });

  it('greys out excluded numbers after each answer', () => {
    let s = withSecret(13);
    s = ask(s, 'gt', 10);
    expect(candidates(s)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    s = ask(s, 'lt', 15);
    expect(candidates(s)).toEqual([11, 12, 13, 14]);
    s = ask(s, 'exact', 12);
    expect(candidates(s)).toEqual([11, 13, 14]);
    expect(isCandidate(s.cases[0].questions, 12)).toBe(false);
  });

  it('builds "between" from two taps in any order', () => {
    let s = withSecret(6);
    s = reduce(s, { type: 'SET_KIND', kind: 'between' });
    s = reduce(s, { type: 'PICK', n: 9 });
    expect(reduce(s, { type: 'ASK' })).toBe(s); // incomplete
    s = reduce(s, { type: 'PICK', n: 4 });
    expect(s.draft).toEqual({ kind: 'between', a: 4, b: 9 });
    s = reduce(s, { type: 'ASK' });
    expect(s.cases[0].questions[0]).toEqual({ kind: 'between', a: 4, b: 9, answer: true });
    expect(candidates(s)).toEqual([4, 5, 6, 7, 8, 9]);
  });

  it('solves a case with an exact hit and ends after the last case', () => {
    let s = ask(withSecret(13), 'exact', 13);
    expect(s.phase).toBe('solved');
    s = reduce(s, { type: 'NEXT_CASE' });
    expect(s.caseIndex).toBe(1);
    s = ask(s, 'exact', 3);
    s = reduce(s, { type: 'NEXT_CASE' });
    expect(s.phase).toBe('over');
    expect(totalQuestions(s)).toBe(2);
  });

  it('rewards questions that split the candidates (interval strategy)', () => {
    const all = Array.from({ length: 20 }, (_, i) => i + 1);
    expect(isGoodSplit(all, { kind: 'gt', a: 10 })).toBe(true);
    expect(isGoodSplit(all, { kind: 'gt', a: 18 })).toBe(false);
    let s = ask(withSecret(5), 'lt', 11);
    expect(s.stats.splits).toBe(1);
    s = ask(s, 'gt', 9); // 1–10 → splits off only one number
    expect(s.stats.splits).toBe(1);
  });
});
