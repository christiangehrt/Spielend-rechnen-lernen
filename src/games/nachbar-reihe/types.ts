import type { BotLevel } from '../../core/bots/bots';

export type NrPresetId = 'farben2' | 'farben4';

export interface NrPreset {
  id: NrPresetId;
  colors: number;
  maxNum: number;
  handSize: number;
}

export interface NrPlayer {
  id: string;
  name: string;
  avatarId: string;
  kind: 'human' | 'bot';
  /** Card ids: color * 100 + value. */
  hand: number[];
}

export interface NrRow {
  min: number;
  max: number;
}

export interface NrState {
  preset: NrPreset;
  players: NrPlayer[];
  deck: number[];
  /** One row per colour; null until its 11 is played. */
  rows: (NrRow | null)[];
  active: number;
  playedThisTurn: number;
  drawsThisTurn: number;
  phase: 'playing' | 'over';
  winner: number | null;
  handoff: boolean;
  lastPlayed: number | null;
  passesInRow: number;
  botLevel: BotLevel;
  rngSeed: number;
}

export type NrAction =
  | { type: 'PLAY'; card: number }
  | { type: 'DRAW' }
  | { type: 'END_TURN' }
  | { type: 'HANDOFF_DONE' }
  | { type: 'BOT_STEP' };
