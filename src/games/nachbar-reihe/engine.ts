import type { BotLevel } from '../../core/bots/bots';
import { nextRandom, shuffle } from '../../core/random/rng';
import type { NrAction, NrPlayer, NrPreset, NrPresetId, NrState } from './types';

export const PRESETS: Record<NrPresetId, NrPreset> = {
  farben2: { id: 'farben2', colors: 2, maxNum: 20, handSize: 7 },
  farben4: { id: 'farben4', colors: 4, maxNum: 20, handSize: 10 },
};

export const START = 11;
export const MAX_DRAWS = 3;
export const colorOf = (card: number) => Math.floor(card / 100);
export const valueOf = (card: number) => card % 100;
export const cardId = (color: number, value: number) => color * 100 + value;

const sortHand = (hand: number[]) => [...hand].sort((a, b) => a - b);

export interface CreateOptions {
  presetId: NrPresetId;
  humans: { name: string; avatarId: string }[];
  bots: { name: string; avatarId: string }[];
  botLevel: BotLevel;
  seed: number;
}

export const createGame = ({ presetId, humans, bots, botLevel, seed }: CreateOptions): NrState => {
  const preset = PRESETS[presetId] ?? PRESETS.farben2;
  const all: number[] = [];
  for (let c = 0; c < preset.colors; c++) for (let v = 1; v <= preset.maxNum; v++) all.push(cardId(c, v));
  const [shuffled, s] = shuffle(all, seed);
  const deck = [...shuffled];
  const players: NrPlayer[] = [
    ...humans.map((h, i) => ({ id: `h${i}`, name: h.name, avatarId: h.avatarId, kind: 'human' as const })),
    ...bots.map((b, i) => ({ id: `b${i}`, name: b.name, avatarId: b.avatarId, kind: 'bot' as const })),
  ].map((p) => ({ ...p, hand: sortHand(deck.splice(0, preset.handSize)) }));
  return {
    preset,
    players,
    deck,
    rows: Array.from({ length: preset.colors }, () => null),
    active: 0,
    playedThisTurn: 0,
    drawsThisTurn: 0,
    phase: 'playing',
    winner: null,
    handoff: false,
    lastPlayed: null,
    passesInRow: 0,
    botLevel,
    rngSeed: s,
  };
};

// ---------- Rules ----------

/** A new 11 opens a colour; otherwise only the neighbours min−1 / max+1 fit. */
export const canPlay = (s: Pick<NrState, 'rows'>, card: number) => {
  const row = s.rows[colorOf(card)];
  const v = valueOf(card);
  if (!row) return v === START;
  return v === row.min - 1 || v === row.max + 1;
};

export const validCards = (s: NrState, player = s.active) => s.players[player].hand.filter((c) => canPlay(s, c));
export const canDraw = (s: NrState) =>
  s.phase === 'playing' && s.playedThisTurn === 0 && validCards(s).length === 0 && s.drawsThisTurn < MAX_DRAWS && s.deck.length > 0;
export const canEndTurn = (s: NrState) =>
  s.phase === 'playing' && (s.playedThisTurn > 0 || (validCards(s).length === 0 && !canDraw(s)));

const nextTurn = (s: NrState, passed: boolean): NrState => {
  const active = (s.active + 1) % s.players.length;
  const humans = s.players.filter((p) => p.kind === 'human').length;
  const passesInRow = passed ? s.passesInRow + 1 : 0;
  // Safety net: if everybody passes twice with an empty deck the round ends (should not happen with a full deck).
  if (passesInRow >= s.players.length * 2) return { ...s, phase: 'over', winner: fewestCards(s) };
  return {
    ...s,
    active,
    playedThisTurn: 0,
    drawsThisTurn: 0,
    passesInRow,
    handoff: humans > 1 && s.players[active].kind === 'human',
  };
};

const fewestCards = (s: NrState) =>
  s.players.reduce((best, p, i) => (p.hand.length < s.players[best].hand.length ? i : best), 0);

export const reduce = (s: NrState, a: NrAction): NrState => {
  if (s.phase !== 'playing') return s;
  if (a.type === 'HANDOFF_DONE') return s.handoff ? { ...s, handoff: false } : s;
  if (s.handoff) return s;
  if (a.type === 'BOT_STEP') {
    if (s.players[s.active].kind !== 'bot') return s;
    const [r, seed] = nextRandom(s.rngSeed);
    const next = { ...s, rngSeed: seed };
    return reduce(next, botDecide(next, r));
  }
  const player = s.players[s.active];
  switch (a.type) {
    case 'PLAY': {
      if (!player.hand.includes(a.card) || !canPlay(s, a.card)) return s;
      const color = colorOf(a.card);
      const v = valueOf(a.card);
      const row = s.rows[color];
      const rows = s.rows.map((r, i) => (i !== color ? r : row ? { min: Math.min(row.min, v), max: Math.max(row.max, v) } : { min: v, max: v }));
      const hand = player.hand.filter((c) => c !== a.card);
      const players = s.players.map((p, i) => (i === s.active ? { ...p, hand } : p));
      const next: NrState = { ...s, rows, players, playedThisTurn: s.playedThisTurn + 1, lastPlayed: a.card, passesInRow: 0 };
      return hand.length === 0 ? { ...next, phase: 'over', winner: s.active } : next;
    }
    case 'DRAW': {
      if (!canDraw(s)) return s;
      const [card, ...deck] = s.deck;
      const players = s.players.map((p, i) => (i === s.active ? { ...p, hand: sortHand([...p.hand, card]) } : p));
      return { ...s, deck, players, drawsThisTurn: s.drawsThisTurn + 1 };
    }
    case 'END_TURN':
      return canEndTurn(s) ? nextTurn(s, s.playedThisTurn === 0) : s;
    default:
      return s;
  }
};

// ---------- Bots (computeBotMove) ----------

/** Does the hand contain a card that could follow `card` once it is on the table? */
const hasFollowUp = (hand: number[], card: number) => {
  const c = colorOf(card);
  const v = valueOf(card);
  return hand.some((h) => h !== card && colorOf(h) === c && (valueOf(h) === v - 1 || valueOf(h) === v + 1));
};

export const botDecide = (s: NrState, random: number): NrAction => {
  const hand = s.players[s.active].hand;
  const valid = hand.filter((c) => canPlay(s, c));
  if (valid.length === 0) return canDraw(s) ? { type: 'DRAW' } : { type: 'END_TURN' };
  const limit = s.botLevel === 'anfaenger' ? 1 : s.botLevel === 'mittel' ? 2 : Infinity;
  if (s.playedThisTurn >= limit) return { type: 'END_TURN' };
  if (s.botLevel === 'anfaenger') return { type: 'PLAY', card: valid[Math.floor(random * valid.length) % valid.length] };
  if (s.botLevel === 'mittel') {
    // prefer edge cards that let the bot continue with its own cards
    const chain = valid.filter((c) => hasFollowUp(hand, c));
    const pool = chain.length ? chain : valid;
    return { type: 'PLAY', card: pool[Math.floor(random * pool.length) % pool.length] };
  }
  // clever: hold back connection cards (e.g. 10/12) that only help the others, unless nothing else is possible
  const useful = valid.filter((c) => hasFollowUp(hand, c) || valueOf(c) === START);
  if (useful.length) return { type: 'PLAY', card: useful[0] };
  if (s.playedThisTurn > 0) return { type: 'END_TURN' };
  return { type: 'PLAY', card: valid.sort((a, b) => Math.abs(valueOf(b) - START) - Math.abs(valueOf(a) - START))[0] };
};
