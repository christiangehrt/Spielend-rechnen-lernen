export type BbPresetId = 'bis5' | 'bis10' | 'bis20';

export interface BbPreset {
  id: BbPresetId;
  min: number;
  max: number;
  tasks: number;
  /** Start / fastest / slowest flash duration in ms (adapts during the round). */
  showMs: number;
  minMs: number;
  maxMs: number;
}

export type Pattern = 'tenframe' | 'dice' | 'scatter';

export interface BbTask {
  n: number;
  pattern: Pattern;
  /** Seed for the positions of scattered dots. */
  seed: number;
}

export interface BbAnswer {
  n: number;
  pattern: Pattern;
  /** Right on the first try without looking again. */
  correct: boolean;
}

export interface BbState {
  preset: BbPreset;
  tasks: BbTask[];
  index: number;
  phase: 'show' | 'answer' | 'feedback' | 'over';
  showMs: number;
  streak: number;
  /** The child looked at the pattern again (counts as help). */
  peeked: boolean;
  /** Wrong taps on the current task. */
  misses: number[];
  answers: BbAnswer[];
}

export type BbAction =
  | { type: 'SHOWN' }
  | { type: 'PEEK' }
  | { type: 'ANSWER'; n: number }
  | { type: 'NEXT' };
