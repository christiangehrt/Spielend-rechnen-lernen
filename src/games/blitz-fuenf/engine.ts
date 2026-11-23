import type { BotLevel } from '../../core/bots/bots';
import { shuffle } from '../../core/random/rng';
import type { BfAction, BfPlayer, BfState } from './types';

export const FRUITS = ['fruit.strawberry', 'fruit.banana', 'fruit.pear', 'fruit.grapes'];
export const fruitOf = (card: number) => Math.floor(card / 10);
export const countOf = (card: number) => card % 10;

/** 14 cards per fruit: five 1s, three 2s, three 3s, two 4s, one 5 → 56 cards. */
export const buildDeck = (): number[] => {
  const deck: number[] = [];
  const counts: [number, number][] = [[1, 5], [2, 3], [3, 3], [4, 2], [5, 1]];
  for (let f = 0; f < FRUITS.length; f++) for (const [count, n] of counts) for (let i = 0; i < n; i++) deck.push(f * 10 + count);
  return deck;
};

export interface CreateOptions {
  humans: { name: string; avatarId: string }[];
  bots: { name: string; avatarId: string }[];
  botLevel: BotLevel;
  seed: number;
  target?: number;
  maxFlips?: number;
  practice?: boolean;
}

export const createGame = ({ humans, bots, botLevel, seed, target = 5, maxFlips = 60, practice = false }: CreateOptions): BfState => {
  const [deck, s] = shuffle(buildDeck(), seed);
  const seats = [
    ...humans.map((h, i) => ({ id: `h${i}`, name: h.name, avatarId: h.avatarId, kind: 'human' as const })),
    ...bots.map((b, i) => ({ id: `b${i}`, name: b.name, avatarId: b.avatarId, kind: 'bot' as const })),
  ];
  const per = Math.floor(deck.length / seats.length);
  const players: BfPlayer[] = seats.map((p, i) => ({ ...p, stack: deck.slice(i * per, (i + 1) * per), open: [] }));
  return { target, players, active: 0, phase: 'playing', lastBuzz: null, buzzCount: 0, flips: 0, maxFlips, botLevel, rngSeed: s, practice };
};

export const topCards = (s: BfState) =>
  s.players.map((p) => (p.open.length ? p.open[p.open.length - 1] : null)).filter((c): c is number => c !== null);

/** Visible total per fruit. */
export const fruitTotals = (s: BfState) => {
  const totals = FRUITS.map(() => 0);
  for (const c of topCards(s)) totals[fruitOf(c)] += countOf(c);
  return totals;
};

/** Is some fruit visible exactly `target` times? */
export const isMatch = (s: BfState) => fruitTotals(s).some((t) => t === s.target);

export const totalCards = (p: BfPlayer) => p.stack.length + p.open.length;

const nextWithCards = (s: BfState, from: number) => {
  for (let step = 1; step <= s.players.length; step++) {
    const i = (from + step) % s.players.length;
    if (s.players[i].stack.length > 0) return i;
  }
  return -1;
};

const checkEnd = (s: BfState): BfState => {
  if (s.flips >= s.maxFlips || s.players.some((p) => totalCards(p) === 0) || s.players.every((p) => p.stack.length === 0)) {
    return { ...s, phase: 'over' };
  }
  if (s.players[s.active].stack.length === 0) {
    const n = nextWithCards(s, s.active);
    return n === -1 ? { ...s, phase: 'over' } : { ...s, active: n };
  }
  return s;
};

export const reduce = (s: BfState, a: BfAction): BfState => {
  if (s.phase !== 'playing') return s;
  switch (a.type) {
    case 'FLIP': {
      if (a.player !== s.active) return s;
      const p = s.players[a.player];
      if (p.stack.length === 0) return s;
      const [card, ...stack] = p.stack;
      const players = s.players.map((x, i) => (i === a.player ? { ...x, stack, open: [...x.open, card] } : x));
      const next = nextWithCards({ ...s, players }, a.player);
      return checkEnd({ ...s, players, active: next === -1 ? a.player : next, flips: s.flips + 1 });
    }
    case 'BUZZ': {
      const buzzer = s.players[a.player];
      if (!buzzer) return s;
      if (isMatch(s)) {
        // Correct: the buzzer wins every open pile (to the bottom of the stack) and flips next.
        const won = s.players.flatMap((p) => p.open);
        const players = s.players.map((p, i) => ({ ...p, open: [], stack: i === a.player ? [...p.stack, ...won] : p.stack }));
        return checkEnd({
          ...s,
          players,
          active: a.player,
          lastBuzz: { player: a.player, correct: true, cards: won.length },
          buzzCount: s.buzzCount + 1,
        });
      }
      // False alarm: give one card to every other player.
      let stack = [...buzzer.stack];
      const gifts = new Map<number, number>();
      s.players.forEach((_, i) => {
        if (i !== a.player && stack.length > 0) {
          gifts.set(i, stack[0]);
          stack = stack.slice(1);
        }
      });
      const players = s.players.map((p, i) =>
        i === a.player ? { ...p, stack } : gifts.has(i) ? { ...p, stack: [...p.stack, gifts.get(i)!] } : p,
      );
      return checkEnd({
        ...s,
        players,
        lastBuzz: { player: a.player, correct: false, cards: gifts.size },
        buzzCount: s.buzzCount + 1,
      });
    }
    default:
      return s;
  }
};

/** Reaction window (ms) and miss chance per bot level. */
export const BOT_REACTION: Record<BotLevel, { min: number; max: number; miss: number }> = {
  anfaenger: { min: 3500, max: 4500, miss: 0.1 },
  mittel: { min: 2000, max: 2800, miss: 0 },
  clever: { min: 1200, max: 1700, miss: 0 },
};

export const winnerIndex = (s: BfState) =>
  s.players.reduce((best, p, i) => (totalCards(p) > totalCards(s.players[best]) ? i : best), 0);
