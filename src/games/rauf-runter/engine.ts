import { popHistory, pushHistory } from '../../core/history';
import { range, shuffle } from '../../core/random/rng';
import { PRESETS } from './presets';
import type { GamePresetId, Pile, Player, TheGameAction, TheGameState } from './types';

// ---------- Pure rule helpers (from the briefing) ----------

export const getTopCard = (pile: Pile): number =>
  pile.cards.length > 0 ? pile.cards[pile.cards.length - 1] : pile.startValue;

export const isReverseJump = (card: number, pile: Pile, delta: number): boolean =>
  pile.direction === 'asc' ? card === getTopCard(pile) - delta : card === getTopCard(pile) + delta;

export const canPlayCard = (card: number, pile: Pile, delta: number): boolean => {
  const top = getTopCard(pile);
  if (isReverseJump(card, pile, delta)) return true;
  return pile.direction === 'asc' ? card > top : card < top;
};

export const getRequiredPlays = (state: Pick<TheGameState, 'deck'>): number => (state.deck.length > 0 ? 2 : 1);

export const activePlayer = (state: TheGameState): Player => state.players[state.activePlayerIndex];

export const hasAnyValidMove = (state: TheGameState): boolean => {
  const hand = state.players[state.activePlayerIndex].hand;
  return hand.some((c) => state.piles.some((p) => canPlayCard(c, p, state.preset.reverseJumpDelta)));
};

export const validPilesFor = (state: TheGameState, card: number): Pile[] =>
  state.piles.filter((p) => canPlayCard(card, p, state.preset.reverseJumpDelta));

export const canEndTurn = (state: TheGameState): boolean =>
  state.status === 'playing' &&
  (state.cardsPlayedThisTurn >= getRequiredPlays(state) || activePlayer(state).hand.length === 0);

export const remainingCards = (state: TheGameState): number =>
  state.deck.length + state.players.reduce((sum, p) => sum + p.hand.length, 0);

// ---------- Setup ----------

export interface CreateOptions {
  presetId: GamePresetId;
  mode: 'solo' | 'coop';
  players: { name: string; avatarId: string }[];
  seed: number;
}

export const createGame = ({ presetId, mode, players, seed }: CreateOptions): TheGameState => {
  const preset = PRESETS[presetId] ?? PRESETS.zr20;
  const [deck] = shuffle(range(preset.minCard, preset.maxCard), seed);
  const seats = mode === 'solo' ? players.slice(0, 1) : players;
  const handSize = mode === 'solo' ? preset.handSizeSolo : preset.handSizeCoop;
  const dealt: Player[] = seats.map((p, i) => ({
    id: `p${i + 1}`,
    name: p.name,
    avatarId: p.avatarId,
    hand: sortHand(deck.splice(0, handSize)),
  }));
  const piles: Pile[] = [
    ...preset.ascendingStarts.map((v, i) => ({ id: `asc${i + 1}`, direction: 'asc' as const, startValue: v, cards: [] })),
    ...preset.descendingStarts.map((v, i) => ({ id: `desc${i + 1}`, direction: 'desc' as const, startValue: v, cards: [] })),
  ];
  return withStatus({
    preset,
    mode,
    deck,
    piles,
    players: dealt,
    activePlayerIndex: 0,
    cardsPlayedThisTurn: 0,
    selectedCard: null,
    awaitingHandoff: false,
    history: [],
    status: 'playing',
    stats: { reverseJumpsUsed: 0, totalTurns: 0 },
  });
};

const sortHand = (hand: number[]) => [...hand].sort((a, b) => a - b);

/** Won when every card is played; lost when the active player cannot fulfil the minimum. */
const withStatus = (state: TheGameState): TheGameState => {
  if (state.deck.length === 0 && state.players.every((p) => p.hand.length === 0)) {
    return { ...state, status: 'won', selectedCard: null };
  }
  const hand = activePlayer(state).hand;
  if (hand.length > 0 && state.cardsPlayedThisTurn < getRequiredPlays(state) && !hasAnyValidMove(state)) {
    return { ...state, status: 'lost', selectedCard: null };
  }
  return { ...state, status: 'playing' };
};

// ---------- Reducer ----------

export const reduce = (state: TheGameState, action: TheGameAction): TheGameState => {
  if (action.type === 'UNDO') {
    if (state.history.length === 0) return state;
    return { ...popHistory(state), selectedCard: null };
  }
  if (state.status !== 'playing') return state;

  switch (action.type) {
    case 'SELECT_CARD': {
      if (state.awaitingHandoff) return state;
      if (action.card !== null && !activePlayer(state).hand.includes(action.card)) return state;
      const card = action.card === state.selectedCard ? null : action.card;
      return { ...state, selectedCard: card };
    }

    case 'PLAY_CARD': {
      if (state.awaitingHandoff) return state;
      const player = activePlayer(state);
      const pile = state.piles.find((p) => p.id === action.pileId);
      if (!pile || !player.hand.includes(action.card)) return state;
      const delta = state.preset.reverseJumpDelta;
      if (!canPlayCard(action.card, pile, delta)) return state;
      const reverse = isReverseJump(action.card, pile, delta);
      const next: TheGameState = {
        ...state,
        history: pushHistory(state),
        piles: state.piles.map((p) => (p.id === pile.id ? { ...p, cards: [...p.cards, action.card] } : p)),
        players: state.players.map((p, i) =>
          i === state.activePlayerIndex ? { ...p, hand: p.hand.filter((c) => c !== action.card) } : p,
        ),
        cardsPlayedThisTurn: state.cardsPlayedThisTurn + 1,
        selectedCard: null,
        stats: { ...state.stats, reverseJumpsUsed: state.stats.reverseJumpsUsed + (reverse ? 1 : 0) },
      };
      return withStatus(next);
    }

    case 'END_TURN': {
      if (state.awaitingHandoff || !canEndTurn(state)) return state;
      const handSize = state.mode === 'solo' ? state.preset.handSizeSolo : state.preset.handSizeCoop;
      const deck = [...state.deck];
      const players = state.players.map((p, i) => {
        if (i !== state.activePlayerIndex) return p;
        const draw = deck.splice(0, Math.max(0, handSize - p.hand.length));
        return { ...p, hand: sortHand([...p.hand, ...draw]) };
      });
      // Next seat that still holds cards (players with empty hands are skipped once the deck is empty).
      let nextIndex = state.activePlayerIndex;
      for (let step = 1; step <= players.length; step++) {
        const candidate = (state.activePlayerIndex + step) % players.length;
        if (players[candidate].hand.length > 0) {
          nextIndex = candidate;
          break;
        }
      }
      return withStatus({
        ...state,
        history: pushHistory(state),
        deck,
        players,
        activePlayerIndex: nextIndex,
        cardsPlayedThisTurn: 0,
        selectedCard: null,
        awaitingHandoff: state.mode === 'coop' && nextIndex !== state.activePlayerIndex,
        stats: { ...state.stats, totalTurns: state.stats.totalTurns + 1 },
      });
    }

    case 'HANDOFF_DONE':
      return state.awaitingHandoff ? { ...state, awaitingHandoff: false } : state;

    default:
      return state;
  }
};

export const canUndo = (state: TheGameState) => state.history.length > 0;
