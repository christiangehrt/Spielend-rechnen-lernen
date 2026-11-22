import type { BotLevel } from '../../core/bots/bots';

export type RrPresetId = 'zr30' | 'original104';

export interface RrPreset {
  id: RrPresetId;
  maxCard: number;
  rows: number;
  handSize: number;
  scoring: 'one' | 'original';
}

export interface RrPlayer {
  id: string;
  name: string;
  avatarId: string;
  kind: 'human' | 'bot';
  hand: number[];
  taken: number[];
  chosen: number | null;
}

export interface QueueItem {
  player: number;
  card: number;
}

export interface RrState {
  preset: RrPreset;
  players: RrPlayer[];
  rows: number[][];
  phase: 'choose' | 'reveal' | 'pickRow' | 'over';
  /** Human player currently choosing (pass-and-play). */
  chooserIndex: number;
  /** Hide hands until the next human confirms (pass-and-play). */
  handoff: boolean;
  /** Revealed cards waiting to be placed, ascending. */
  queue: QueueItem[];
  /** All cards revealed this round (for display). */
  revealed: QueueItem[];
  lastMove: { player: number; card: number; row: number; took: number[] } | null;
  botLevel: BotLevel;
  rngSeed: number;
  turn: number;
}

export type RrAction =
  | { type: 'CHOOSE'; card: number }
  | { type: 'HANDOFF_DONE' }
  | { type: 'STEP' }
  | { type: 'PICK_ROW'; row: number };
