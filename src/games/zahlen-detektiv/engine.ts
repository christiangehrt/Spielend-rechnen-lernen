import { randomInt } from '../../core/random/rng';
import { PRESETS } from './presets';
import type { Draft, Question, ZdAction, ZdPresetId, ZdState } from './types';

export const createGame = (presetId: ZdPresetId, seed: number): ZdState => {
  const preset = PRESETS[presetId] ?? PRESETS.bis20;
  const cases = [];
  let s = seed;
  const used = new Set<number>();
  for (let i = 0; i < preset.cases; i++) {
    let secret: number;
    do {
      [secret, s] = randomInt(s, 1, preset.max);
    } while (used.has(secret) && used.size < preset.max);
    used.add(secret);
    cases.push({ secret, questions: [] });
  }
  return { preset, cases, caseIndex: 0, draft: null, phase: 'asking', stats: { splits: 0 } };
};

export const currentCase = (s: ZdState) => s.cases[Math.min(s.caseIndex, s.cases.length - 1)];

export const answerFor = (q: Omit<Question, 'answer'>, secret: number): boolean => {
  switch (q.kind) {
    case 'gt':
      return secret > q.a;
    case 'lt':
      return secret < q.a;
    case 'between':
      return secret >= Math.min(q.a, q.b!) && secret <= Math.max(q.a, q.b!);
    case 'exact':
      return secret === q.a;
  }
};

/** Is `n` still possible given all answers so far? */
export const isCandidate = (questions: readonly Question[], n: number) =>
  questions.every((q) => answerFor(q, n) === q.answer);

export const candidates = (s: ZdState): number[] => {
  const qs = currentCase(s).questions;
  const out: number[] = [];
  for (let n = 1; n <= s.preset.max; n++) if (isCandidate(qs, n)) out.push(n);
  return out;
};

export const isDraftComplete = (d: Draft | null): d is Draft & { a: number } =>
  !!d && d.a !== null && (d.kind !== 'between' || d.b !== null);

/** A question is a good "split" when both answers would leave at least ~35 % of the candidates. */
export const isGoodSplit = (cands: readonly number[], q: Omit<Question, 'answer'>) => {
  if (cands.length < 4) return false;
  const yes = cands.filter((n) => answerFor(q, n)).length;
  return Math.min(yes, cands.length - yes) >= Math.ceil(cands.length * 0.35);
};

export const reduce = (s: ZdState, a: ZdAction): ZdState => {
  switch (a.type) {
    case 'SET_KIND':
      if (s.phase !== 'asking') return s;
      return { ...s, draft: { kind: a.kind, a: null, b: null } };
    case 'PICK': {
      if (s.phase !== 'asking' || a.n < 1 || a.n > s.preset.max) return s;
      const d = s.draft ?? { kind: 'exact' as const, a: null, b: null };
      if (d.kind === 'between') {
        if (d.a === null || d.b !== null) return { ...s, draft: { ...d, a: a.n, b: null } };
        if (d.a === a.n) return s;
        return { ...s, draft: { ...d, a: Math.min(d.a, a.n), b: Math.max(d.a, a.n) } };
      }
      return { ...s, draft: { ...d, a: a.n } };
    }
    case 'CLEAR_DRAFT':
      return s.draft ? { ...s, draft: null } : s;
    case 'ASK': {
      if (s.phase !== 'asking' || !isDraftComplete(s.draft)) return s;
      const c = currentCase(s);
      const base = { kind: s.draft.kind, a: s.draft.a, ...(s.draft.kind === 'between' ? { b: s.draft.b! } : {}) };
      const q: Question = { ...base, answer: answerFor(base, c.secret) };
      const split = q.kind !== 'exact' && isGoodSplit(candidates(s), base);
      const cases = s.cases.map((x, i) => (i === s.caseIndex ? { ...x, questions: [...x.questions, q] } : x));
      const solved = q.kind === 'exact' && q.answer;
      return {
        ...s,
        cases,
        draft: null,
        phase: solved ? 'solved' : 'asking',
        stats: { splits: s.stats.splits + (split ? 1 : 0) },
      };
    }
    case 'NEXT_CASE': {
      if (s.phase !== 'solved') return s;
      const caseIndex = s.caseIndex + 1;
      if (caseIndex >= s.cases.length) return { ...s, phase: 'over' };
      return { ...s, caseIndex, draft: null, phase: 'asking' };
    }
    default:
      return s;
  }
};

export const totalQuestions = (s: ZdState) => s.cases.reduce((n, c) => n + c.questions.length, 0);
export const lastQuestion = (s: ZdState): Question | null => {
  const qs = currentCase(s).questions;
  return qs[qs.length - 1] ?? null;
};
