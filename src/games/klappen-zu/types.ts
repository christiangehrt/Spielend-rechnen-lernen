export type KlappenPresetId = 'klappen6' | 'klappen9' | 'klappen12';

export interface KlappenPreset {
  id: KlappenPresetId;
  maxFlap: number;
  /** Fixed number of dice; null = two dice with the one-die option once all flaps > 6 are shut. */
  fixedDice: 1 | null;
}

export interface KlappenState {
  preset: KlappenPreset;
  /** Open flap values, ascending. */
  open: number[];
  dice: number[] | null;
  phase: 'roll' | 'select' | 'over';
  /** Flaps picked for the current roll but not confirmed yet (undo-able). */
  selected: number[];
  /** Flaps closed by the last confirmed move (for the closing animation). */
  lastClosed: number[];
  rngSeed: number;
  stats: { rolls: number; multiSplits: number };
}

export type KlappenAction =
  | { type: 'ROLL'; diceCount: 1 | 2 }
  | { type: 'TOGGLE'; value: number }
  | { type: 'CONFIRM' }
  | { type: 'UNDO' };
