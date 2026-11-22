import type { BotLevel } from '../../core/bots/bots';

export interface BfPlayer {
  id: string;
  name: string;
  avatarId: string;
  kind: 'human' | 'bot';
  /** Face-down stack, index 0 is the top. Cards: fruit * 10 + count. */
  stack: number[];
  /** Face-up pile, last element is visible. */
  open: number[];
}

export interface BfState {
  target: number;
  players: BfPlayer[];
  active: number;
  phase: 'playing' | 'over';
  lastBuzz: { player: number; correct: boolean; cards: number } | null;
  buzzCount: number;
  flips: number;
  maxFlips: number;
  botLevel: BotLevel;
  rngSeed: number;
}

export type BfAction = { type: 'FLIP'; player: number } | { type: 'BUZZ'; player: number };
