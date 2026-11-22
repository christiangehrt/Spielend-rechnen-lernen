import { describe, expect, it } from 'vitest';
import { ANIMALS, DECK_SIZE, kindOf, valueOf } from './cards';
import { botChooseCards, classify, createGame, findEquation, isEquation, points, reduce, whoActs } from './engine';
import type { SsState } from './types';

// card ids: numbers 0–39 (value = id % 10 + 1), wecker 40–47, dieb 48–51, wachhund 52–54,
// schlaflied 55–58, trommel 59–61, clown 62–66
const N = (v: number, copy = 0) => copy * 10 + (v - 1);
const WECKER = 40;
const DIEB = 48;
const WACHHUND = 52;
const SCHLAFLIED = 55;
const TROMMEL = 59;
const CLOWN = 62;

const base = () =>
  createGame({
    presetId: 'junior',
    humans: [{ name: 'Mia', avatarId: 'a' }],
    bots: [{ name: 'Robo', avatarId: 'b' }],
    botLevel: 'anfaenger',
    seed: 7,
  });

const setup = (hands: number[][], extra: Partial<SsState> = {}): SsState => {
  const s = base();
  const used = new Set(hands.flat());
  return {
    ...s,
    deck: s.deck.concat(s.players.flatMap((p) => p.hand)).filter((c) => !used.has(c)),
    players: s.players.map((p, i) => ({ ...p, hand: hands[i] ?? [] })),
    ...extra,
  };
};

const play = (s: SsState, cards: number[]) => {
  let n = s;
  for (const c of cards) n = reduce(n, { type: 'SELECT', card: c });
  return reduce(n, { type: 'PLAY_SELECTED' });
};

describe('cards', () => {
  it('has 67 cards with the right counts', () => {
    expect(DECK_SIZE).toBe(67);
    const kinds = Array.from({ length: DECK_SIZE }, (_, i) => kindOf(i));
    expect(kinds.filter((k) => k === 'number')).toHaveLength(40);
    expect(kinds.filter((k) => k === 'wecker')).toHaveLength(8);
    expect(kinds.filter((k) => k === 'clown')).toHaveLength(5);
    expect(valueOf(N(7, 3))).toBe(7);
  });
  it('has 12 sleeping animals worth 125 points', () => {
    expect(ANIMALS.reduce((s, a) => s + a.points, 0)).toBe(125);
    const s = base();
    expect(s.castle.filter((x) => x !== null)).toHaveLength(12);
    s.players.forEach((p) => expect(p.hand).toHaveLength(5));
  });
});

describe('equations', () => {
  it('accepts 2- and multi-summand equations and rejects wrong ones', () => {
    expect(isEquation([2, 3, 5])).toBe(true);
    expect(isEquation([5, 3, 2])).toBe(true);
    expect(isEquation([1, 2, 3, 6])).toBe(true);
    expect(isEquation([1, 2, 4, 7])).toBe(true);
    expect(isEquation([2, 2, 4])).toBe(true);
    expect(isEquation([2, 3, 6])).toBe(false);
    expect(isEquation([1, 2])).toBe(false);
  });

  it('classifies selections', () => {
    const s = setup([[N(2), N(3), N(5), N(4, 1), N(4, 2)], []]);
    expect(classify(s, [N(2), N(3), N(5)])).toBe('equation');
    expect(classify(s, [N(4, 1), N(4, 2)])).toBe('pair');
    expect(classify(s, [N(2), N(3)])).toBe('invalid');
    expect(classify(s, [N(2)])).toBe('single');
    expect(classify(s, [N(2), WECKER])).toBe('invalid');
  });

  it('discards an equation, refills to 5 and counts the strategy', () => {
    let s = setup([[N(1), N(2), N(3), N(6), N(9)], [N(8)]]);
    s = play(s, [N(1), N(2), N(3), N(6)]);
    expect(s.players[0].hand).toHaveLength(5);
    expect(s.stats.equations[0]).toBe(1);
    expect(s.active).toBe(1);
    expect(s.discard).toEqual(expect.arrayContaining([N(1), N(2), N(3), N(6)]));
  });

  it('rejects an invalid equation', () => {
    const s = setup([[N(2), N(3), N(6), N(9), N(1)], []]);
    const sel = reduce(reduce(reduce(s, { type: 'SELECT', card: N(2) }), { type: 'SELECT', card: N(3) }), { type: 'SELECT', card: N(6) });
    expect(reduce(sel, { type: 'PLAY_SELECTED' })).toBe(sel);
  });
});

describe('action cards', () => {
  it('Wecker wakes a sleeping animal', () => {
    let s = setup([[WECKER, N(1), N(2), N(3), N(4)], [N(5)]]);
    s = play(s, [WECKER]);
    expect(s.phase).toBe('chooseSleeping');
    const animal = s.castle[3];
    s = reduce(s, { type: 'CHOOSE_SLEEPING', spot: 3 });
    expect(s.players[0].animals).toEqual([animal]);
    expect(s.castle[3]).toBeNull();
    expect(s.players[0].hand).toHaveLength(5);
  });

  it('can cancel an action before choosing', () => {
    let s = setup([[WECKER, N(1), N(2), N(3), N(4)], [N(5)]]);
    s = reduce(play(s, [WECKER]), { type: 'CANCEL' });
    expect(s.phase).toBe('turn');
    expect(s.players[0].hand).toContain(WECKER);
  });

  it('Waschbär steals unless blocked by the Wachhund (interrupt)', () => {
    let s = setup([[DIEB, N(1), N(2), N(3), N(4)], [WACHHUND, N(5)]]);
    s = { ...s, players: s.players.map((p, i) => (i === 1 ? { ...p, animals: [11] } : p)), castle: s.castle.map((a) => (a === 11 ? null : a)) };
    s = play(s, [DIEB]);
    s = reduce(s, { type: 'CHOOSE_TARGET', player: 1, animal: 11 });
    expect(s.phase).toBe('counter');
    expect(whoActs(s)).toBe(1);
    const blocked = reduce(s, { type: 'COUNTER', use: true });
    expect(blocked.players[1].animals).toEqual([11]);
    expect(blocked.lastEvent).toEqual({ type: 'blocked', defender: 1, with: 'wachhund' });
    expect(blocked.players[1].hand).not.toContain(WACHHUND);
    const stolen = reduce(s, { type: 'COUNTER', use: false });
    expect(stolen.players[0].animals).toEqual([11]);
    expect(points(stolen.players[0])).toBe(20);
  });

  it('Schlaflied sends an animal back to sleep unless the Trommel blocks it', () => {
    let s = setup([[SCHLAFLIED, N(1), N(2), N(3), N(4)], [N(5)]]);
    s = { ...s, players: s.players.map((p, i) => (i === 1 ? { ...p, animals: [4] } : p)), castle: s.castle.map((a) => (a === 4 ? null : a)) };
    s = play(s, [SCHLAFLIED]);
    s = reduce(s, { type: 'CHOOSE_TARGET', player: 1, animal: 4 });
    expect(s.players[1].animals).toEqual([]);
    expect(s.castle.filter((a) => a !== null)).toHaveLength(12);
    let t = setup([[SCHLAFLIED, N(1), N(2), N(3), N(4)], [TROMMEL]]);
    t = { ...t, players: t.players.map((p, i) => (i === 1 ? { ...p, animals: [4] } : p)), castle: t.castle.map((a) => (a === 4 ? null : a)) };
    t = reduce(reduce(play(t, [SCHLAFLIED]), { type: 'CHOOSE_TARGET', player: 1, animal: 4 }), { type: 'COUNTER', use: true });
    expect(t.players[1].animals).toEqual([4]);
  });

  it('cannot steal when nobody has an animal', () => {
    const s = setup([[DIEB, N(1), N(2), N(3), N(4)], []]);
    expect(classify(s, [DIEB])).toBe('invalid');
  });

  it('Clown with a number lets the counted player wake an animal', () => {
    let s = setup([[CLOWN, N(1), N(2), N(3), N(4)], [N(5)]]);
    s = { ...s, deck: [N(2, 3), ...s.deck.filter((c) => c !== N(2, 3))] }; // reveals a 2 → second player
    s = play(s, [CLOWN]);
    expect(s.phase).toBe('chooseSleeping');
    expect(s.pending?.chooser).toBe(1);
    expect(reduce(s, { type: 'CANCEL' })).toBe(s);
  });

  it('Clown with an action card keeps it and plays again', () => {
    let s = setup([[CLOWN, N(1), N(2), N(3), N(4)], [N(5)]]);
    s = { ...s, deck: [WECKER + 1, ...s.deck.filter((c) => c !== WECKER + 1)] };
    s = play(s, [CLOWN]);
    expect(s.phase).toBe('turn');
    expect(s.active).toBe(0);
    expect(s.players[0].hand).toContain(WECKER + 1);
  });
});

describe('winning & bots', () => {
  it('wins with 4 animals (junior)', () => {
    let s = setup([[WECKER, N(1), N(2), N(3), N(4)], [N(5)]]);
    s = { ...s, players: s.players.map((p, i) => (i === 0 ? { ...p, animals: [0, 1, 2] } : p)), castle: s.castle.map((a) => (a !== null && a < 3 ? null : a)) };
    s = play(s, [WECKER]);
    s = reduce(s, { type: 'CHOOSE_SLEEPING', spot: s.castle.findIndex((a) => a !== null) });
    expect(s.phase).toBe('over');
    expect(s.winner).toBe(0);
  });

  it('beginner bots overlook equations, clever bots find long ones', () => {
    const hand = [N(1), N(2), N(4), N(7), N(10)];
    expect(findEquation(hand, 'anfaenger')).toBeNull();
    expect(findEquation(hand, 'mittel')).toBeNull(); // only 1 + 2 + 4 = 7 (4 cards)
    expect(findEquation(hand, 'clever')?.length).toBe(4);
    expect(findEquation([N(2), N(3), N(5), N(9), N(9, 1)], 'mittel')?.length).toBe(3);
  });

  it('bots play action cards first', () => {
    const s = { ...setup([[N(1)], [N(3), WECKER, N(4)]]), active: 1 };
    expect(botChooseCards(s, 0.5)).toEqual([WECKER]);
  });

  it('bot-only games always finish', () => {
    for (const level of ['anfaenger', 'mittel', 'clever'] as const) {
      for (let seed = 1; seed <= 15; seed++) {
        let s = createGame({
          presetId: 'profi',
          humans: [],
          bots: [
            { name: 'A', avatarId: 'a' },
            { name: 'B', avatarId: 'b' },
            { name: 'C', avatarId: 'c' },
          ],
          botLevel: level,
          seed,
        });
        let guard = 0;
        while (s.phase !== 'over' && guard++ < 3000) s = reduce(s, { type: 'BOT_STEP' });
        expect(s.phase).toBe('over');
      }
    }
  });
});
