export type GamePresetId = 'zr20' | 'zr50' | 'original100';

export interface TheGamePreset {
  id: GamePresetId;
  label: string;
  minCard: number; // 2
  maxCard: number; // 19 (ZR 20 default), 49, 99
  ascendingStarts: number[]; // [1] for ZR 20; [1, 1] for original
  descendingStarts: number[]; // [20] for ZR 20; [100, 100] for original
  reverseJumpDelta: number; // 5 (ZR 20) or 10 (ZR 50 / 100)
  handSizeSolo: number; // 6 (ZR 20) or 8 (original)
  handSizeCoop: number;
}

export interface Pile {
  id: string;
  direction: 'asc' | 'desc';
  startValue: number;
  cards: number[]; // last element = top card
}

export interface Player {
  id: string;
  name: string;
  avatarId: string;
  hand: number[];
}

export interface TheGameState {
  preset: TheGamePreset;
  mode: 'solo' | 'coop';
  deck: number[];
  piles: Pile[];
  players: Player[];
  activePlayerIndex: number;
  cardsPlayedThisTurn: number;
  selectedCard: number | null;
  /** Coop pass-and-play: hide the hand until the next player confirms. */
  awaitingHandoff: boolean;
  history: Omit<TheGameState, 'history'>[]; // for the undo button
  status: 'playing' | 'won' | 'lost';
  stats: { reverseJumpsUsed: number; totalTurns: number };
}

export type TheGameAction =
  | { type: 'SELECT_CARD'; card: number | null }
  | { type: 'PLAY_CARD'; card: number; pileId: string }
  | { type: 'END_TURN' }
  | { type: 'HANDOFF_DONE' }
  | { type: 'UNDO' };
