import { describe, expect, it } from 'vitest';
import { botChooseCard, botChooseRow, cardPoints, createGame, playerPoints, reduce, targetRow } from './engine';
import type { RrState } from './types';

const game = (botLevel: 'anfaenger' | 'mittel' | 'clever' = 'anfaenger') =>
  createGame({
    presetId: 'zr30',
    humans: [{ name: 'Mia', avatarId: 'a' }],
    bots: [
      { name: 'Robo', avatarId: 'b' },
      { name: 'Bolt', avatarId: 'c' },
    ],
    botLevel,
    seed: 11,
  });

const controlled = (rows: number[][], hands: number[][], extra: Partial<RrState> = {}): RrState => {
  const s = game();
  return { ...s, rows, players: s.players.map((p, i) => ({ ...p, hand: hands[i] ?? [], taken: [] })), ...extra };
};

describe('setup & scoring', () => {
  it('deals the junior default: cards 1–30, 3 rows, 6 cards each', () => {
    const s = game();
    expect(s.rows).toHaveLength(3);
    s.rows.forEach((r) => expect(r).toHaveLength(1));
    s.players.forEach((p) => expect(p.hand).toHaveLength(6));
    const all = [...s.rows.flat(), ...s.players.flatMap((p) => p.hand)];
    expect(new Set(all).size).toBe(21);
    all.forEach((c) => expect(c >= 1 && c <= 30).toBe(true));
  });

  it('scores 1 point per card (junior) and original values (profi)', () => {
    expect(cardPoints(13, 'one')).toBe(1);
    expect(cardPoints(55, 'original')).toBe(7);
    expect(cardPoints(33, 'original')).toBe(5);
    expect(cardPoints(20, 'original')).toBe(3);
    expect(cardPoints(15, 'original')).toBe(2);
    expect(cardPoints(7, 'original')).toBe(1);
  });

  it('finds the row with the largest end card below the card', () => {
    expect(targetRow([[3], [9], [14]], 12)).toBe(1);
    expect(targetRow([[3], [9], [14]], 20)).toBe(2);
    expect(targetRow([[3], [9], [14]], 2)).toBe(-1);
  });
});

describe('resolution order (ascending)', () => {
  it('processes simultaneously chosen cards strictly ascending', () => {
    let s = controlled([[5], [10], [20]], [[12, 1], [11, 2], [13, 3]]);
    s = reduce(s, { type: 'CHOOSE', card: 12 });
    expect(s.phase).toBe('reveal');
    expect(s.queue.map((q) => q.card)).toEqual(s.revealed.map((q) => q.card));
    const order = s.queue.map((q) => q.card);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    while (s.phase === 'reveal') s = reduce(s, { type: 'STEP' });
    // all three cards (bots chose some card from their hands) placed in ascending order without errors
    expect(s.rows.flat().length + s.players.reduce((n, p) => n + p.taken.length, 0)).toBe(6);
  });

  it('the 6th card takes the row and starts a new one', () => {
    let s = controlled([[1, 2, 3, 4, 5], [20], [25]], [[6], [], []], {
      players: game().players.map((p, i) => ({ ...p, kind: i === 0 ? 'human' : 'human', hand: i === 0 ? [6] : [] })),
    });
    s = { ...s, phase: 'reveal', queue: [{ player: 0, card: 6 }], revealed: [{ player: 0, card: 6 }] };
    s = reduce(s, { type: 'STEP' });
    expect(s.players[0].taken).toEqual([1, 2, 3, 4, 5]);
    expect(s.rows[0]).toEqual([6]);
    expect(playerPoints(s, 0)).toBe(5);
  });

  it('asks a human to pick a row for a too-small card, then sets it as the new first card before the next card', () => {
    let s = controlled([[10, 11], [15], [20, 21, 22]], [[3], [], []]);
    s = { ...s, phase: 'reveal', queue: [{ player: 0, card: 3 }, { player: 1, card: 12 }], revealed: [] };
    s = reduce(s, { type: 'STEP' });
    expect(s.phase).toBe('pickRow');
    expect(reduce(s, { type: 'STEP' })).toBe(s);
    s = reduce(s, { type: 'PICK_ROW', row: 0 });
    expect(s.rows[0]).toEqual([3]);
    expect(s.players[0].taken).toEqual([10, 11]);
    s = reduce(s, { type: 'STEP' });
    // the new first card (3) is the largest end below 12, so 12 joins row 0
    expect(s.rows[0]).toEqual([3, 12]);
  });

  it('lets a bot take a row automatically', () => {
    let s = controlled([[10], [15, 16], [20]], [[], [2], []]);
    s = { ...s, phase: 'reveal', queue: [{ player: 1, card: 2 }], revealed: [] };
    s = reduce(s, { type: 'STEP' });
    expect(s.players[1].taken.length).toBeGreaterThan(0);
    expect(s.rows.some((r) => r[0] === 2)).toBe(true);
  });
});

describe('bots', () => {
  it('mittel avoids rows with 4–5 cards', () => {
    const s = { ...controlled([[1, 2, 3, 4, 5], [12], [25]], [[], [6, 13], []]), botLevel: 'mittel' as const };
    expect(botChooseCard(s, 1, 0.3)).toBe(13);
  });

  it('mittel/clever take the row with the fewest points', () => {
    const s = { ...controlled([[1, 2, 3], [12], [25, 26]], [[], [], []]), botLevel: 'clever' as const };
    expect(botChooseRow(s, 0.9)).toBe(1);
  });

  it('anfaenger picks valid cards from its hand', () => {
    const s = game('anfaenger');
    for (let r = 0; r < 1; r += 0.05) expect(s.players[1].hand).toContain(botChooseCard(s, 1, r));
  });
});

describe('full game', () => {
  it('plays to the end with 3 bots levels without getting stuck', () => {
    for (const level of ['anfaenger', 'mittel', 'clever'] as const) {
      let s = game(level);
      let guard = 0;
      while (s.phase !== 'over' && guard++ < 500) {
        if (s.phase === 'choose') s = reduce(s, { type: 'CHOOSE', card: s.players[0].hand[0] });
        else if (s.phase === 'pickRow') s = reduce(s, { type: 'PICK_ROW', row: 0 });
        else s = reduce(s, { type: 'STEP' });
      }
      expect(s.phase).toBe('over');
      expect(s.players.every((p) => p.hand.length === 0)).toBe(true);
      expect(s.turn).toBe(6);
    }
  });
});
