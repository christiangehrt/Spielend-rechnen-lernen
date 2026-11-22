import type { BotLevel } from '../../core/bots/bots';
import { nextRandom, range, shuffle } from '../../core/random/rng';
import type { QueueItem, RrAction, RrPlayer, RrPreset, RrPresetId, RrState } from './types';

export const PRESETS: Record<RrPresetId, RrPreset> = {
  zr30: { id: 'zr30', maxCard: 30, rows: 3, handSize: 6, scoring: 'one' },
  original104: { id: 'original104', maxCard: 104, rows: 4, handSize: 10, scoring: 'original' },
};

export const ROW_LIMIT = 5; // the 6th card takes the row

/** Points of a card: 1 in the junior mode; original "head" values in the profi mode. */
export const cardPoints = (card: number, scoring: RrPreset['scoring']) => {
  if (scoring === 'one') return 1;
  if (card === 55) return 7;
  if (card % 11 === 0) return 5;
  if (card % 10 === 0) return 3;
  if (card % 5 === 0) return 2;
  return 1;
};

export const rowPoints = (row: number[], scoring: RrPreset['scoring']) =>
  row.reduce((sum, c) => sum + cardPoints(c, scoring), 0);

export const playerPoints = (s: RrState, i: number) => rowPoints(s.players[i].taken, s.preset.scoring);

/** Index of the row a card belongs to (largest end card below it), or -1 if it is smaller than all ends. */
export const targetRow = (rows: number[][], card: number): number => {
  let best = -1;
  rows.forEach((row, i) => {
    const end = row[row.length - 1];
    if (end < card && (best === -1 || end > rows[best][rows[best].length - 1])) best = i;
  });
  return best;
};

export interface CreateOptions {
  presetId: RrPresetId;
  humans: { name: string; avatarId: string }[];
  bots: { name: string; avatarId: string }[];
  botLevel: BotLevel;
  seed: number;
}

export const createGame = ({ presetId, humans, bots, botLevel, seed }: CreateOptions): RrState => {
  const preset = PRESETS[presetId] ?? PRESETS.zr30;
  let [deck, s] = shuffle(range(1, preset.maxCard), seed);
  deck = [...deck];
  const rows = Array.from({ length: preset.rows }, () => [deck.shift()!]);
  const players: RrPlayer[] = [
    ...humans.map((h, i) => ({ id: `h${i}`, name: h.name, avatarId: h.avatarId, kind: 'human' as const })),
    ...bots.map((b, i) => ({ id: `b${i}`, name: b.name, avatarId: b.avatarId, kind: 'bot' as const })),
  ].map((p) => ({ ...p, hand: deck.splice(0, preset.handSize).sort((a, b) => a - b), taken: [], chosen: null }));
  return {
    preset,
    players,
    rows,
    phase: 'choose',
    chooserIndex: 0,
    handoff: false,
    queue: [],
    revealed: [],
    lastMove: null,
    botLevel,
    rngSeed: s,
    turn: 1,
  };
};

// ---------- Bot heuristics (computeBotMove) ----------

const rand = (s: RrState): [number, RrState] => {
  const [v, ns] = nextRandom(s.rngSeed);
  return [v, { ...s, rngSeed: ns }];
};

/** Which card a bot plays. */
export const botChooseCard = (s: RrState, playerIndex: number, random: number): number => {
  const hand = s.players[playerIndex].hand;
  const { rows, preset, botLevel } = s;
  const ends = rows.map((r) => r[r.length - 1]);
  const gap = (card: number) => {
    const t = targetRow(rows, card);
    return t === -1 ? Infinity : card - ends[t];
  };
  if (botLevel === 'anfaenger') {
    // 50 % random card, 50 % the card with the smallest gap (ignores full rows)
    if (random < 0.5) return hand[Math.floor((random / 0.5) * hand.length) % hand.length];
    return [...hand].sort((a, b) => gap(a) - gap(b))[0];
  }
  const minTake = Math.min(...rows.map((r) => rowPoints(r, preset.scoring)));
  const opponents = s.players.length - 1;
  const known = new Set<number>([...rows.flat(), ...hand, ...s.players.flatMap((p) => p.taken)]);
  const unknown = preset.maxCard - known.size;
  const cost = (card: number) => {
    const t = targetRow(rows, card);
    if (t === -1) return minTake + 0.5;
    const row = rows[t];
    if (row.length >= ROW_LIMIT) return rowPoints(row, preset.scoring) + cardPoints(card, preset.scoring);
    if (botLevel === 'mittel') return row.length >= 4 ? 3 + gap(card) / 10 : gap(card) / 100;
    // clever: probability that enough other cards land in between
    const slots = ROW_LIMIT - row.length;
    const pBetween = Math.min(1, ((card - ends[t] - 1) * opponents) / Math.max(1, unknown));
    return Math.pow(pBetween, slots) * rowPoints(row, preset.scoring) + gap(card) / 1000;
  };
  return [...hand].sort((a, b) => cost(a) - cost(b) || a - b)[0];
};

/** Which row a bot takes when its card is smaller than every row end. */
export const botChooseRow = (s: RrState, random: number): number => {
  if (s.botLevel === 'anfaenger') return Math.floor(random * s.rows.length) % s.rows.length;
  let best = 0;
  s.rows.forEach((row, i) => {
    const pts = rowPoints(row, s.preset.scoring);
    const bestPts = rowPoints(s.rows[best], s.preset.scoring);
    if (pts < bestPts || (pts === bestPts && row.length < s.rows[best].length)) best = i;
  });
  return best;
};

// ---------- Reducer ----------

const humanIndices = (s: RrState) => s.players.map((p, i) => (p.kind === 'human' ? i : -1)).filter((i) => i >= 0);

const startChoosing = (s: RrState): RrState => {
  if (s.players.every((p) => p.hand.length === 0)) return { ...s, phase: 'over', queue: [] };
  const first = humanIndices(s)[0] ?? 0;
  return { ...s, phase: 'choose', chooserIndex: first, handoff: humanIndices(s).length > 1, queue: [], turn: s.turn + 1 };
};

const revealAll = (state: RrState): RrState => {
  let s = state;
  const players = s.players.map((p) => ({ ...p }));
  players.forEach((p, i) => {
    if (p.kind === 'bot') {
      let r: number;
      [r, s] = rand(s);
      p.chosen = botChooseCard({ ...s, players }, i, r);
    }
  });
  const queue: QueueItem[] = players
    .map((p, i) => ({ player: i, card: p.chosen! }))
    .sort((a, b) => a.card - b.card);
  return {
    ...s,
    players: players.map((p) => ({ ...p, hand: p.hand.filter((c) => c !== p.chosen), chosen: null })),
    phase: 'reveal',
    queue,
    revealed: queue,
    handoff: false,
  };
};

const place = (s: RrState, item: QueueItem, rowIndex: number, take: boolean): RrState => {
  const took = take ? s.rows[rowIndex] : [];
  const rows = s.rows.map((r, i) => (i === rowIndex ? (take ? [item.card] : [...r, item.card]) : r));
  const players = s.players.map((p, i) => (i === item.player ? { ...p, taken: [...p.taken, ...took] } : p));
  const next: RrState = {
    ...s,
    rows,
    players,
    queue: s.queue.slice(1),
    lastMove: { player: item.player, card: item.card, row: rowIndex, took },
    phase: 'reveal',
  };
  return next.queue.length === 0 ? startChoosing(next) : next;
};

export const reduce = (s: RrState, a: RrAction): RrState => {
  switch (a.type) {
    case 'CHOOSE': {
      if (s.phase !== 'choose' || s.handoff) return s;
      const me = s.players[s.chooserIndex];
      if (!me || me.kind !== 'human' || !me.hand.includes(a.card)) return s;
      const players = s.players.map((p, i) => (i === s.chooserIndex ? { ...p, chosen: a.card } : p));
      const nextHuman = humanIndices(s).find((i) => players[i].chosen === null);
      if (nextHuman !== undefined) return { ...s, players, chooserIndex: nextHuman, handoff: true };
      return revealAll({ ...s, players });
    }
    case 'HANDOFF_DONE':
      return s.handoff ? { ...s, handoff: false } : s;
    case 'STEP': {
      if (s.phase !== 'reveal' || s.queue.length === 0) return s;
      const item = s.queue[0];
      const t = targetRow(s.rows, item.card);
      if (t === -1) {
        if (s.players[item.player].kind === 'human') return { ...s, phase: 'pickRow' };
        const [r, s2] = rand(s);
        return place(s2, item, botChooseRow(s2, r), true);
      }
      return place(s, item, t, s.rows[t].length >= ROW_LIMIT);
    }
    case 'PICK_ROW': {
      if (s.phase !== 'pickRow' || a.row < 0 || a.row >= s.rows.length) return s;
      return place(s, s.queue[0], a.row, true);
    }
    default:
      return s;
  }
};
