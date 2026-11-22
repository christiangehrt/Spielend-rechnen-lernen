import { describe, expect, it } from 'vitest';
import {
  canEndTurn,
  canPlayCard,
  createGame,
  getRequiredPlays,
  getTopCard,
  hasAnyValidMove,
  isReverseJump,
  reduce,
  remainingCards,
} from './engine';
import { PRESETS } from './presets';
import type { Pile, TheGameState } from './types';

const asc = (cards: number[] = [], startValue = 1): Pile => ({ id: 'asc1', direction: 'asc', startValue, cards });
const desc = (cards: number[] = [], startValue = 20): Pile => ({ id: 'desc1', direction: 'desc', startValue, cards });

const solo = (seed = 1) =>
  createGame({ presetId: 'zr20', mode: 'solo', players: [{ name: 'Mia', avatarId: 'avatar.fox' }], seed });

/** Build a controlled state on top of a real one. */
const withState = (patch: Partial<TheGameState> & { hand?: number[] }): TheGameState => {
  const base = solo();
  const { hand, ...rest } = patch;
  return {
    ...base,
    ...rest,
    players: hand ? [{ ...base.players[0], hand }] : (rest.players ?? base.players),
  };
};

describe('rule helpers', () => {
  it('reads the start value of an empty pile', () => {
    expect(getTopCard(asc())).toBe(1);
    expect(getTopCard(desc())).toBe(20);
    expect(getTopCard(asc([4, 9]))).toBe(9);
  });

  it('allows only bigger cards on the ascending pile, except the -5 jump', () => {
    expect(canPlayCard(10, asc([9]), 5)).toBe(true);
    expect(canPlayCard(8, asc([9]), 5)).toBe(false);
    expect(canPlayCard(4, asc([9]), 5)).toBe(true);
    expect(isReverseJump(4, asc([9]), 5)).toBe(true);
    expect(canPlayCard(9, asc([9]), 5)).toBe(false);
  });

  it('allows only smaller cards on the descending pile, except the +5 jump', () => {
    expect(canPlayCard(12, desc([13]), 5)).toBe(true);
    expect(canPlayCard(14, desc([13]), 5)).toBe(false);
    expect(canPlayCard(18, desc([13]), 5)).toBe(true);
    expect(isReverseJump(18, desc([13]), 5)).toBe(true);
  });

  it('uses ±10 in the profi presets', () => {
    expect(PRESETS.original100.reverseJumpDelta).toBe(10);
    expect(canPlayCard(40, asc([50], 1), 10)).toBe(true);
    expect(canPlayCard(45, asc([50], 1), 10)).toBe(false);
  });
});

describe('setup', () => {
  it('deals the ZR 20 default: cards 2–19, 1 up + 1 down pile, 6 cards', () => {
    const s = solo(42);
    expect(s.piles.map((p) => [p.direction, p.startValue])).toEqual([
      ['asc', 1],
      ['desc', 20],
    ]);
    expect(s.players[0].hand).toHaveLength(6);
    expect(remainingCards(s)).toBe(18);
    const all = [...s.deck, ...s.players[0].hand].sort((a, b) => a - b);
    expect(all).toEqual(Array.from({ length: 18 }, (_, i) => i + 2));
    expect(s.players[0].hand).toEqual([...s.players[0].hand].sort((a, b) => a - b));
  });

  it('deals the original: 2–99, 4 piles, 8 cards', () => {
    const s = createGame({ presetId: 'original100', mode: 'solo', players: [{ name: 'A', avatarId: 'x' }], seed: 3 });
    expect(s.piles).toHaveLength(4);
    expect(s.players[0].hand).toHaveLength(8);
    expect(remainingCards(s)).toBe(98);
  });
});

describe('turns', () => {
  it('requires 2 plays while the deck has cards, then refills the hand', () => {
    let s = withState({ hand: [3, 5, 8, 12, 15, 17], deck: [2, 4, 6] });
    expect(getRequiredPlays(s)).toBe(2);
    s = reduce(s, { type: 'PLAY_CARD', card: 3, pileId: 'asc1' });
    expect(canEndTurn(s)).toBe(false);
    expect(reduce(s, { type: 'END_TURN' })).toBe(s);
    s = reduce(s, { type: 'PLAY_CARD', card: 17, pileId: 'desc1' });
    expect(canEndTurn(s)).toBe(true);
    s = reduce(s, { type: 'END_TURN' });
    expect(s.players[0].hand).toEqual([2, 4, 5, 8, 12, 15]);
    expect(s.deck).toEqual([6]);
    expect(s.cardsPlayedThisTurn).toBe(0);
    expect(s.stats.totalTurns).toBe(1);
  });

  it('drops the minimum to 1 card once the deck is empty', () => {
    let s = withState({ hand: [5, 9], deck: [] });
    expect(getRequiredPlays(s)).toBe(1);
    s = reduce(s, { type: 'PLAY_CARD', card: 5, pileId: 'asc1' });
    expect(canEndTurn(s)).toBe(true);
  });

  it('rejects invalid plays without changing state', () => {
    const s = withState({
      hand: [3, 5],
      piles: [asc([10]), desc([12])],
      deck: [4],
    });
    expect(reduce(s, { type: 'PLAY_CARD', card: 3, pileId: 'asc1' })).toBe(s);
    expect(reduce(s, { type: 'PLAY_CARD', card: 99, pileId: 'asc1' })).toBe(s);
    expect(reduce(s, { type: 'PLAY_CARD', card: 3, pileId: 'nope' })).toBe(s);
  });

  it('counts reverse jumps for the strategy bonus', () => {
    let s = withState({ hand: [4, 11, 13], piles: [asc([9]), desc()], deck: [2] });
    s = reduce(s, { type: 'PLAY_CARD', card: 4, pileId: 'asc1' });
    expect(s.stats.reverseJumpsUsed).toBe(1);
  });

  it('selects and deselects cards', () => {
    let s = solo();
    const c = s.players[0].hand[0];
    s = reduce(s, { type: 'SELECT_CARD', card: c });
    expect(s.selectedCard).toBe(c);
    s = reduce(s, { type: 'SELECT_CARD', card: c });
    expect(s.selectedCard).toBeNull();
  });
});

describe('end of game', () => {
  it('is won when deck and hand are empty', () => {
    let s = withState({ hand: [7], deck: [] });
    s = reduce(s, { type: 'PLAY_CARD', card: 7, pileId: 'asc1' });
    expect(s.status).toBe('won');
  });

  it('is lost when the minimum cannot be played', () => {
    let s = withState({ hand: [6, 8], piles: [asc([7]), desc([5])], deck: [2, 3] });
    // 8 fits on the up pile, then 6 fits nowhere → only 1 of 2 required cards
    s = reduce(s, { type: 'PLAY_CARD', card: 8, pileId: 'asc1' });
    expect(hasAnyValidMove(s)).toBe(false);
    expect(s.status).toBe('lost');
  });

  it('is not lost once the minimum is reached, even without further moves', () => {
    let s = withState({ hand: [10, 12, 6], piles: [asc([9]), desc([13])], deck: [2] });
    s = reduce(s, { type: 'PLAY_CARD', card: 10, pileId: 'asc1' });
    s = reduce(s, { type: 'PLAY_CARD', card: 12, pileId: 'desc1' });
    expect(s.status).toBe('playing');
    expect(canEndTurn(s)).toBe(true);
  });
});

describe('undo', () => {
  it('restores the previous move exactly', () => {
    const start = withState({ hand: [3, 5, 8], deck: [2, 4] });
    const played = reduce(start, { type: 'PLAY_CARD', card: 5, pileId: 'asc1' });
    const undone = reduce(played, { type: 'UNDO' });
    expect(undone.players[0].hand).toEqual([3, 5, 8]);
    expect(undone.piles).toEqual(start.piles);
    expect(undone.cardsPlayedThisTurn).toBe(0);
    expect(undone.history).toHaveLength(0);
  });

  it('can take back a losing move', () => {
    let s = withState({ hand: [6, 8], piles: [asc([7]), desc([5])], deck: [2, 3] });
    s = reduce(s, { type: 'PLAY_CARD', card: 8, pileId: 'asc1' });
    expect(s.status).toBe('lost');
    s = reduce(s, { type: 'UNDO' });
    expect(s.status).toBe('playing');
    expect(s.players[0].hand).toEqual([6, 8]);
  });

  it('undoes an end of turn (returns drawn cards to the deck)', () => {
    let s = withState({ hand: [3, 5, 8, 12, 15, 17], deck: [2, 4, 6] });
    s = reduce(s, { type: 'PLAY_CARD', card: 3, pileId: 'asc1' });
    s = reduce(s, { type: 'PLAY_CARD', card: 17, pileId: 'desc1' });
    const before = s;
    s = reduce(s, { type: 'END_TURN' });
    s = reduce(s, { type: 'UNDO' });
    expect(s.deck).toEqual(before.deck);
    expect(s.players[0].hand).toEqual(before.players[0].hand);
  });
});

describe('coop pass-and-play', () => {
  const coop = () =>
    createGame({
      presetId: 'zr20',
      mode: 'coop',
      players: [
        { name: 'Mia', avatarId: 'a' },
        { name: 'Papa', avatarId: 'b' },
      ],
      seed: 5,
    });

  it('deals two hands and hands over after a turn', () => {
    let s = coop();
    expect(s.players.map((p) => p.hand.length)).toEqual([5, 5]);
    // play two valid cards greedily
    for (let i = 0; i < 2; i++) {
      const hand = s.players[0].hand;
      const move = hand.flatMap((c) => s.piles.filter((p) => canPlayCard(c, p, 5)).map((p) => ({ c, p: p.id })))[0];
      s = reduce(s, { type: 'PLAY_CARD', card: move.c, pileId: move.p });
    }
    s = reduce(s, { type: 'END_TURN' });
    expect(s.activePlayerIndex).toBe(1);
    expect(s.awaitingHandoff).toBe(true);
    expect(reduce(s, { type: 'SELECT_CARD', card: s.players[1].hand[0] })).toBe(s);
    s = reduce(s, { type: 'HANDOFF_DONE' });
    expect(s.awaitingHandoff).toBe(false);
  });

  it('skips players with empty hands when the deck is empty', () => {
    const base = coop();
    let s: TheGameState = {
      ...base,
      deck: [],
      players: [
        { ...base.players[0], hand: [5] },
        { ...base.players[1], hand: [] },
      ],
      piles: [asc([2]), desc([19])],
    };
    s = reduce(s, { type: 'PLAY_CARD', card: 5, pileId: 'asc1' });
    expect(s.status).toBe('won');
  });
});
