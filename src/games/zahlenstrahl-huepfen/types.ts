export type ZhPresetId = 'plus10' | 'plus20' | 'minus20' | 'plus100';

export interface ZhPreset {
  id: ZhPresetId;
  op: '+' | '-';
  max: number;
  /** Visible part of the number line (null = 0…max). */
  windowSize: number | null;
  tasksPerRound: number;
}

export interface Task {
  start: number;
  amount: number;
}

export interface TaskResult {
  crossesTen: boolean;
  bridged: boolean; // stopped exactly on the ten and used 2 jumps
  jumps: number;
}

export interface ZhState {
  preset: ZhPreset;
  tasks: Task[];
  taskIndex: number;
  position: number;
  /** Signed jump sizes of the current task. */
  jumps: number[];
  results: TaskResult[];
  phase: 'jumping' | 'taskDone' | 'over';
}

export type ZhAction = { type: 'JUMP'; to: number } | { type: 'NEXT_TASK' } | { type: 'UNDO' };

export type JumpCheck = 'ok' | 'wrongDirection' | 'tooFar' | 'tinyStep' | 'outside';
