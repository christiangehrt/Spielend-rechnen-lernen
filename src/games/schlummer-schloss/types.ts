import type { BotLevel } from '../../core/bots/bots';

export type CardKind = 'number' | 'wecker' | 'dieb' | 'wachhund' | 'schlaflied' | 'trommel' | 'clown';

export type SsPresetId = 'junior' | 'profi';

export interface SsPreset {
  id: SsPresetId;
  winAnimals: number;
  winPoints: number;
}

export interface SsPlayer {
  id: string;
  name: string;
  avatarId: string;
  kind: 'human' | 'bot';
  hand: number[];
  animals: number[];
}

export interface Pending {
  card: number;
  actor: number;
  /** Player who picks the sleeping animal (Wecker: actor; Clown: counted player). */
  chooser?: number;
  target?: { player: number; animal: number };
  /** Card revealed by the clown. */
  revealed?: number;
}

export type SsEvent =
  | { type: 'wake'; player: number; animal: number; by: 'wecker' | 'clown' }
  | { type: 'steal'; from: number; to: number; animal: number }
  | { type: 'sleep'; player: number; animal: number }
  | { type: 'blocked'; defender: number; with: 'wachhund' | 'trommel' }
  | { type: 'clown'; player: number; card: number; chooser?: number }
  | { type: 'discard'; player: number; cards: number[]; kind: 'single' | 'pair' | 'equation' };

export interface SsState {
  preset: SsPreset;
  players: SsPlayer[];
  /** 12 castle spots: sleeping animal id or null when awake. */
  castle: (number | null)[];
  deck: number[];
  discard: number[];
  active: number;
  phase: 'turn' | 'chooseSleeping' | 'chooseTarget' | 'counter' | 'over';
  pending: Pending | null;
  selected: number[];
  lastEvent: SsEvent | null;
  eventId: number;
  winner: number | null;
  handoff: boolean;
  botLevel: BotLevel;
  rngSeed: number;
  stats: { equations: number[] };
}

export type SsAction =
  | { type: 'SELECT'; card: number }
  | { type: 'PLAY_SELECTED' }
  | { type: 'CHOOSE_SLEEPING'; spot: number }
  | { type: 'CHOOSE_TARGET'; player: number; animal: number }
  | { type: 'COUNTER'; use: boolean }
  | { type: 'CANCEL' }
  | { type: 'HANDOFF_DONE' }
  | { type: 'BOT_STEP' };
