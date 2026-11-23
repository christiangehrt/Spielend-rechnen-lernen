import { describe, expect, it } from 'vitest';
import { buildDeck, createGame, fruitTotals, isMatch, reduce, totalCards } from './engine';
import type { BfState } from './types';

const game = () =>
  createGame({ humans: [{ name: 'Mia', avatarId: 'a' }], bots: [{ name: 'Robo', avatarId: 'b' }], botLevel: 'anfaenger', seed: 3 });

const table = (open0: number[], open1: number[], stacks: number[][] = [[11, 12], [13, 14]]): BfState => {
  const s = game();
  return { ...s, players: s.players.map((p, i) => ({ ...p, open: i ? open1 : open0, stack: stacks[i] })) };
};

describe('deck', () => {
  it('has 56 cards, 14 per fruit, fruit counts 1–5', () => {
    const d = buildDeck();
    expect(d).toHaveLength(56);
    for (let f = 0; f < 4; f++) expect(d.filter((c) => Math.floor(c / 10) === f)).toHaveLength(14);
    expect(d.filter((c) => c % 10 === 5)).toHaveLength(4);
  });
  it('deals evenly', () => {
    const s = game();
    expect(s.players.map((p) => p.stack.length)).toEqual([28, 28]);
  });
});

describe('matching five', () => {
  it('sums only the visible top cards per fruit', () => {
    const s = table([2, 13], [32, 12]); // top: 13 (fruit 1 ×3) and 12 (fruit 1 ×2)
    expect(fruitTotals(s)).toEqual([0, 5, 0, 0]);
    expect(isMatch(s)).toBe(true);
    expect(isMatch(table([14], [22]))).toBe(false);
    expect(isMatch(table([5], []))).toBe(true);
  });
});

describe('practice mode', () => {
  it('is only set when requested', () => {
    expect(game().practice).toBe(false);
    const p = createGame({ humans: [{ name: 'Mia', avatarId: 'a' }], bots: [{ name: 'Robo', avatarId: 'b' }], botLevel: 'anfaenger', seed: 3, practice: true });
    expect(p.practice).toBe(true);
    expect(p.players).toHaveLength(2);
  });
});

describe('turns', () => {
  it('only the active player flips, then the turn passes', () => {
    let s = game();
    expect(reduce(s, { type: 'FLIP', player: 1 })).toBe(s);
    s = reduce(s, { type: 'FLIP', player: 0 });
    expect(s.players[0].open).toHaveLength(1);
    expect(s.active).toBe(1);
  });

  it('a correct buzz wins all open cards', () => {
    let s = table([13], [12]);
    s = reduce(s, { type: 'BUZZ', player: 1 });
    expect(s.lastBuzz).toEqual({ player: 1, correct: true, cards: 2 });
    expect(s.players[1].stack).toEqual([13, 14, 13, 12]);
    expect(s.players.every((p) => p.open.length === 0)).toBe(true);
    expect(s.active).toBe(1);
  });

  it('a false alarm gives one card to every other player', () => {
    let s = table([14], [22]);
    s = reduce(s, { type: 'BUZZ', player: 0 });
    expect(s.lastBuzz?.correct).toBe(false);
    expect(s.players[0].stack).toEqual([12]);
    expect(s.players[1].stack).toEqual([13, 14, 11]);
  });

  it('ends when a player runs out of cards and the most cards win', () => {
    let s = table([], [], [[11], [12, 13]]);
    s = reduce(s, { type: 'FLIP', player: 0 }); // player 0 still has an open card
    expect(s.phase).toBe('playing');
    s = reduce(s, { type: 'BUZZ', player: 0 }); // false alarm, but no stack card left to give
    expect(totalCards(s.players[0])).toBe(1);
  });

  it('ends after the flip limit', () => {
    let s: BfState = { ...game(), maxFlips: 4 };
    for (let i = 0; i < 4; i++) s = reduce(s, { type: 'FLIP', player: s.active });
    expect(s.phase).toBe('over');
  });
});
