import { randomInt, nextRandom } from '../../core/random/rng';
import type { BbAction, BbPreset, BbPresetId, BbState, BbTask, Pattern } from './types';

export const PRESETS: Record<BbPresetId, BbPreset> = {
  bis5: { id: 'bis5', min: 1, max: 5, tasks: 10, showMs: 2200, minMs: 1000, maxMs: 4000 },
  bis10: { id: 'bis10', min: 1, max: 10, tasks: 10, showMs: 2500, minMs: 900, maxMs: 4500 },
  bis20: { id: 'bis20', min: 6, max: 20, tasks: 10, showMs: 3000, minMs: 1200, maxMs: 5000 },
};

/** Faster after 2 right answers in a row, slower after a mistake. */
export const FASTER_BY = 300;
export const SLOWER_BY = 400;

const patternFor = (n: number, r: number): Pattern => {
  if (n > 10) return 'tenframe';
  if (n <= 4 && r < 0.35) return 'scatter'; // small unstructured sets: subitising
  if (n <= 6 && r < 0.6) return 'dice';
  return 'tenframe';
};

export const generateTasks = (preset: BbPreset, seed: number): BbTask[] => {
  const tasks: BbTask[] = [];
  let s = seed;
  for (let i = 0; i < preset.tasks; i++) {
    let n: number;
    let tries = 0;
    do {
      [n, s] = randomInt(s, preset.min, preset.max);
      tries++;
      // no immediate repetition, and favour the harder upper half from task 4 on
    } while (tries < 20 && (n === tasks[i - 1]?.n || (i >= 3 && preset.max === 10 && n < 4 && tries < 6)));
    const [r, s2] = nextRandom(s);
    s = s2;
    tasks.push({ n, pattern: patternFor(n, r), seed: s });
  }
  return tasks;
};

export const createGame = (presetId: BbPresetId, seed: number): BbState => {
  const preset = PRESETS[presetId] ?? PRESETS.bis10;
  return {
    preset,
    tasks: generateTasks(preset, seed),
    index: 0,
    phase: 'show',
    showMs: preset.showMs,
    streak: 0,
    peeked: false,
    misses: [],
    answers: [],
  };
};

export const currentTask = (s: BbState) => s.tasks[Math.min(s.index, s.tasks.length - 1)];
export const firstTryCorrect = (s: BbState) => s.answers.filter((a) => a.correct).length;

export const reduce = (s: BbState, a: BbAction): BbState => {
  switch (a.type) {
    case 'SHOWN':
      return s.phase === 'show' ? { ...s, phase: 'answer' } : s;
    case 'PEEK':
      return s.phase === 'answer' ? { ...s, phase: 'show', peeked: true } : s;
    case 'ANSWER': {
      if (s.phase !== 'answer') return s;
      const task = currentTask(s);
      if (a.n !== task.n) {
        // Wrong: show the pattern again with an explanation, slow down a little.
        if (s.misses.includes(a.n)) return s;
        return { ...s, misses: [...s.misses, a.n], streak: 0, showMs: Math.min(s.preset.maxMs, s.showMs + SLOWER_BY) };
      }
      const correct = s.misses.length === 0 && !s.peeked;
      const streak = correct ? s.streak + 1 : 0;
      const showMs = correct && streak >= 2 ? Math.max(s.preset.minMs, s.showMs - FASTER_BY) : s.showMs;
      return {
        ...s,
        phase: 'feedback',
        streak,
        showMs,
        answers: [...s.answers, { n: task.n, pattern: task.pattern, correct }],
      };
    }
    case 'NEXT': {
      if (s.phase !== 'feedback') return s;
      const index = s.index + 1;
      if (index >= s.tasks.length) return { ...s, phase: 'over' };
      return { ...s, index, phase: 'show', peeked: false, misses: [] };
    }
    default:
      return s;
  }
};

/** Deterministic, non-overlapping positions (0–100 %) for scattered dots. */
export const scatterPositions = (n: number, seed: number): { x: number; y: number }[] => {
  const pts: { x: number; y: number }[] = [];
  let s = seed;
  for (let guard = 0; pts.length < n && guard < 500; guard++) {
    const [x, s1] = randomInt(s, 15, 85);
    const [y, s2] = randomInt(s1, 15, 85);
    s = s2;
    if (pts.every((p) => Math.hypot(p.x - x, p.y - y) > 26)) pts.push({ x, y });
  }
  return pts;
};
