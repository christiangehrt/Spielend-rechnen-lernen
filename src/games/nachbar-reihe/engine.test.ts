import { describe, expect, it } from 'vitest';
import { botDecide, canDraw, canEndTurn, canPlay, cardId, createGame, reduce } from './engine';
import type { NrState } from './types';

const game = (level: 'anfaenger' | 'mittel' | 'clever' = 'anfaenger', presetId: 'farben2' | 'farben4' = 'farben2') =>
  createGame({
    presetId,
    humans: [{ name: 'Mia', avatarId: 'a' }],
    bots: [{ name: 'Robo', avatarId: 'b' }],
    botLevel: level,
    seed: 4,
  });

const R = (v: number) => cardId(0, v); // red
const B = (v: number) => cardId(1, v); // blue

const withHands = (hands: number[][], extra: Partial<NrState> = {}): NrState => {
  const s = game();
  return { ...s, players: s.players.map((p, i) => ({ ...p, hand: hands[i] })), ...extra };
};

describe('setup', () => {
  it('uses 2 colours × 1–20 (40 cards) and deals 7 cards', () => {
    const s = game();
    expect(s.rows).toEqual([null, null]);
    expect(s.players[0].hand).toHaveLength(7);
    expect(s.deck.length + 14).toBe(40);
  });
  it('original uses 4 colours (80 cards)', () => {
    const s = game('anfaenger', 'farben4');
    expect(s.deck.length + 20).toBe(80);
  });
});

describe('rules', () => {
  it('opens a colour only with 11, then neighbours on both sides', () => {
    let s = withHands([[R(11), R(10), R(12), R(9), B(5)], [B(11)]], { deck: [B(1)] });
    expect(canPlay(s, R(10))).toBe(false);
    s = reduce(s, { type: 'PLAY', card: R(11) });
    expect(s.rows[0]).toEqual({ min: 11, max: 11 });
    expect(canPlay(s, R(10))).toBe(true);
    expect(canPlay(s, R(12))).toBe(true);
    expect(canPlay(s, R(9))).toBe(false);
    s = reduce(s, { type: 'PLAY', card: R(10) });
    s = reduce(s, { type: 'PLAY', card: R(9) });
    expect(s.rows[0]).toEqual({ min: 9, max: 11 });
    expect(reduce(s, { type: 'PLAY', card: B(5) })).toBe(s);
  });

  it('allows drawing up to 3 cards only without any valid move', () => {
    let s = withHands([[R(5)], [B(11)]], { deck: [R(1), R(2), R(3), R(4)] });
    expect(canDraw(s)).toBe(true);
    expect(canEndTurn(s)).toBe(false);
    s = reduce(s, { type: 'DRAW' });
    s = reduce(s, { type: 'DRAW' });
    s = reduce(s, { type: 'DRAW' });
    expect(s.players[0].hand).toHaveLength(4);
    expect(canDraw(s)).toBe(false);
    expect(canEndTurn(s)).toBe(true);
    s = reduce(s, { type: 'END_TURN' });
    expect(s.active).toBe(1);
  });

  it('stops drawing once a playable card arrives', () => {
    let s = withHands([[R(5)], [B(3)]], { deck: [R(11), R(2)] });
    s = reduce(s, { type: 'DRAW' });
    expect(canDraw(s)).toBe(false);
    s = reduce(s, { type: 'PLAY', card: R(11) });
    expect(canEndTurn(s)).toBe(true);
  });

  it('wins with 0 cards in hand', () => {
    let s = withHands([[R(11)], [B(3)]]);
    s = reduce(s, { type: 'PLAY', card: R(11) });
    expect(s.phase).toBe('over');
    expect(s.winner).toBe(0);
  });
});

describe('bots', () => {
  it('anfaenger plays only one card per turn', () => {
    const s = withHands([[B(3)], [R(11), R(12), R(13)]], { active: 1 });
    let n = reduce(s, { type: 'BOT_STEP' });
    expect(n.playedThisTurn).toBe(1);
    n = reduce(n, { type: 'BOT_STEP' });
    expect(n.active).toBe(0);
  });

  it('mittel plays up to two cards', () => {
    let s: NrState = { ...withHands([[B(3)], [R(11), R(12), R(13)]], { active: 1 }), botLevel: 'mittel' };
    s = reduce(reduce(s, { type: 'BOT_STEP' }), { type: 'BOT_STEP' });
    expect(s.playedThisTurn).toBe(2);
    s = reduce(s, { type: 'BOT_STEP' });
    expect(s.active).toBe(0);
  });

  it('clever holds back a connecting card that only helps others', () => {
    const s: NrState = {
      ...withHands([[B(3)], [R(10), R(15), R(16)]], { active: 1, rows: [{ min: 11, max: 14 }, null], playedThisTurn: 1 }),
      botLevel: 'clever',
    };
    // R10 has no follow-up in its hand → held back; R15 has follow-up R16 → but it was already played? here R15 valid with follow-up
    expect(botDecide(s, 0.5)).toEqual({ type: 'PLAY', card: R(15) });
    const s2: NrState = { ...s, players: s.players.map((p, i) => (i === 1 ? { ...p, hand: [R(10), R(20)] } : p)) };
    expect(botDecide(s2, 0.5)).toEqual({ type: 'END_TURN' });
  });

  it('plays complete games against every bot level without getting stuck', () => {
    for (const level of ['anfaenger', 'mittel', 'clever'] as const) {
      for (let seed = 1; seed <= 20; seed++) {
        let s = createGame({
          presetId: 'farben2',
          humans: [],
          bots: [
            { name: 'A', avatarId: 'a' },
            { name: 'B', avatarId: 'b' },
          ],
          botLevel: level,
          seed,
        });
        let guard = 0;
        while (s.phase === 'playing' && guard++ < 2000) s = reduce(s, { type: 'BOT_STEP' });
        expect(s.phase).toBe('over');
        expect(s.winner).not.toBeNull();
      }
    }
  });
});
