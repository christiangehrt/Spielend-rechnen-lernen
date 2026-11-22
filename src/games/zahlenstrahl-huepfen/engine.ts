import { randomInt } from '../../core/random/rng';
import { PRESETS } from './presets';
import type { JumpCheck, Task, TaskResult, ZhAction, ZhPreset, ZhPresetId, ZhState } from './types';

export const goalOf = (preset: ZhPreset, t: Task) => (preset.op === '+' ? t.start + t.amount : t.start - t.amount);

/** Does the task pass a multiple of ten (landing exactly on it does not count)? */
export const crossesTen = (preset: ZhPreset, t: Task) => {
  const goal = goalOf(preset, t);
  return Math.floor(t.start / 10) !== Math.floor(goal / 10) && goal % 10 !== 0 && t.start % 10 !== 0;
};

/** The ten that is passed on the way (for the "Zehner-Zwischenstopp"). */
export const bridgeTen = (preset: ZhPreset, t: Task) =>
  preset.op === '+' ? Math.ceil(t.start / 10) * 10 : Math.floor(t.start / 10) * 10;

const makeTask = (preset: ZhPreset, seed: number, crossing: boolean): [Task, number] => {
  let s = seed;
  for (let attempt = 0; attempt < 200; attempt++) {
    let start: number;
    let amount: number;
    if (preset.id === 'plus10') {
      [start, s] = randomInt(s, 1, 6);
      [amount, s] = randomInt(s, 2, Math.min(5, 10 - start));
    } else if (preset.id === 'plus20') {
      if (crossing) {
        [start, s] = randomInt(s, 5, 9);
        [amount, s] = randomInt(s, 11 - start, Math.min(9, 19 - start));
      } else {
        [start, s] = randomInt(s, 1, 5);
        [amount, s] = randomInt(s, 2, 4);
      }
    } else if (preset.id === 'minus20') {
      if (crossing) {
        [start, s] = randomInt(s, 11, 16);
        [amount, s] = randomInt(s, start - 9, Math.min(9, start - 2));
      } else {
        [start, s] = randomInt(s, 15, 19);
        [amount, s] = randomInt(s, 2, start - 11);
      }
    } else {
      [start, s] = randomInt(s, 12, 88);
      if (start % 10 === 0) start += 3;
      const ones = start % 10;
      [amount, s] = crossing ? randomInt(s, 11 - ones, 9) : randomInt(s, 2, Math.max(2, 9 - ones));
    }
    const task = { start, amount };
    const goal = goalOf(preset, task);
    if (amount < 1 || goal < 0 || goal > preset.max) continue;
    if (preset.id !== 'plus10' && crossesTen(preset, task) !== crossing) continue;
    return [task, s];
  }
  return [{ start: 7, amount: preset.op === '+' ? 5 : 3 }, s];
};

export const generateTasks = (preset: ZhPreset, seed: number): Task[] => {
  const tasks: Task[] = [];
  let s = seed;
  for (let i = 0; i < preset.tasksPerRound; i++) {
    // first task is a warm-up without crossing the ten; the rest practise the ten bridge
    let task: Task;
    let tries = 0;
    do {
      [task, s] = makeTask(preset, s, i > 0);
      tries++;
    } while (tries < 20 && tasks.some((t) => t.start === task.start && t.amount === task.amount));
    tasks.push(task);
  }
  return tasks;
};

export const createGame = (presetId: ZhPresetId, seed: number): ZhState => {
  const preset = PRESETS[presetId] ?? PRESETS.plus20;
  const tasks = generateTasks(preset, seed);
  return { preset, tasks, taskIndex: 0, position: tasks[0].start, jumps: [], results: [], phase: 'jumping' };
};

export const currentTask = (s: ZhState) => s.tasks[Math.min(s.taskIndex, s.tasks.length - 1)];
export const jumpedSoFar = (s: ZhState) => Math.abs(s.jumps.reduce((a, b) => a + b, 0));
export const remaining = (s: ZhState) => currentTask(s).amount - jumpedSoFar(s);
export const goal = (s: ZhState) => goalOf(s.preset, currentTask(s));

/** Visible number line range [from, to]. */
export const lineWindow = (s: ZhState): [number, number] => {
  if (!s.preset.windowSize) return [0, s.preset.max];
  const t = currentTask(s);
  const low = Math.min(t.start, goalOf(s.preset, t));
  const from = Math.max(0, Math.min(Math.floor(low / 10) * 10, s.preset.max - s.preset.windowSize));
  return [from, from + s.preset.windowSize];
};

/**
 * Single "trippel" steps are blocked – except when they land on a ten or
 * finish the task. Jumps beyond the remaining amount are "too far".
 */
export const checkJump = (s: ZhState, to: number): JumpCheck => {
  if (s.phase !== 'jumping') return 'outside';
  const [from, upTo] = lineWindow(s);
  if (to < from || to > upTo) return 'outside';
  const size = to - s.position;
  if (size === 0 || (s.preset.op === '+' ? size < 0 : size > 0)) return 'wrongDirection';
  const dist = Math.abs(size);
  const rest = remaining(s);
  if (dist > rest) return 'tooFar';
  if (dist === 1 && rest !== 1 && to % 10 !== 0) return 'tinyStep';
  return 'ok';
};

export const reduce = (s: ZhState, a: ZhAction): ZhState => {
  switch (a.type) {
    case 'JUMP': {
      if (checkJump(s, a.to) !== 'ok') return s;
      const jumps = [...s.jumps, a.to - s.position];
      const next: ZhState = { ...s, position: a.to, jumps };
      if (remaining(next) > 0) return next;
      const task = currentTask(s);
      const crosses = crossesTen(s.preset, task);
      const ten = bridgeTen(s.preset, task);
      let pos = task.start;
      const stops = jumps.map((j) => (pos += j));
      const result: TaskResult = {
        crossesTen: crosses,
        bridged: crosses && jumps.length === 2 && stops[0] === ten,
        jumps: jumps.length,
      };
      return { ...next, phase: 'taskDone', results: [...s.results, result] };
    }
    case 'NEXT_TASK': {
      if (s.phase !== 'taskDone') return s;
      const taskIndex = s.taskIndex + 1;
      if (taskIndex >= s.tasks.length) return { ...s, phase: 'over' };
      return { ...s, taskIndex, position: s.tasks[taskIndex].start, jumps: [], phase: 'jumping' };
    }
    case 'UNDO': {
      if (s.phase !== 'jumping' || s.jumps.length === 0) return s;
      const last = s.jumps[s.jumps.length - 1];
      return { ...s, position: s.position - last, jumps: s.jumps.slice(0, -1) };
    }
    default:
      return s;
  }
};

export const canUndo = (s: ZhState) => s.phase === 'jumping' && s.jumps.length > 0;

export const bridgedCount = (s: ZhState) => s.results.filter((r) => r.bridged).length;
export const crossingCount = (s: ZhState) => s.results.filter((r) => r.crossesTen).length;
