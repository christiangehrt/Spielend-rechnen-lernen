import type { BotLevel } from '../../core/bots/bots';
import { nextRandom, range, shuffle } from '../../core/random/rng';
import { ANIMALS, DECK_SIZE, isNumber, kindOf, valueOf } from './cards';
import type { CardKind, SsAction, SsEvent, SsPlayer, SsPreset, SsPresetId, SsState } from './types';

export const PRESETS: Record<SsPresetId, SsPreset> = {
  junior: { id: 'junior', winAnimals: 4, winPoints: 40 },
  profi: { id: 'profi', winAnimals: 5, winPoints: 50 },
};
export const HAND_SIZE = 5;
const COUNTER: Partial<Record<CardKind, CardKind>> = { dieb: 'wachhund', schlaflied: 'trommel' };

export interface CreateOptions {
  presetId: SsPresetId;
  humans: { name: string; avatarId: string }[];
  bots: { name: string; avatarId: string }[];
  botLevel: BotLevel;
  seed: number;
}

export const createGame = ({ presetId, humans, bots, botLevel, seed }: CreateOptions): SsState => {
  const preset = PRESETS[presetId] ?? PRESETS.junior;
  let [deck, s] = shuffle(range(0, DECK_SIZE - 1), seed);
  deck = [...deck];
  const [castle, s2] = shuffle(range(0, ANIMALS.length - 1), s);
  const players: SsPlayer[] = [
    ...humans.map((h, i) => ({ id: `h${i}`, name: h.name, avatarId: h.avatarId, kind: 'human' as const })),
    ...bots.map((b, i) => ({ id: `b${i}`, name: b.name, avatarId: b.avatarId, kind: 'bot' as const })),
  ].map((p) => ({ ...p, hand: deck.splice(0, HAND_SIZE), animals: [] }));
  return {
    preset,
    players,
    castle,
    deck,
    discard: [],
    active: 0,
    phase: 'turn',
    pending: null,
    selected: [],
    lastEvent: null,
    eventId: 0,
    winner: null,
    handoff: false,
    botLevel,
    rngSeed: s2,
    stats: { equations: players.map(() => 0) },
  };
};

// ---------- helpers ----------

export const points = (p: SsPlayer) => p.animals.reduce((sum, a) => sum + ANIMALS[a].points, 0);
export const sleepingSpots = (s: SsState) => s.castle.map((a, i) => (a === null ? -1 : i)).filter((i) => i >= 0);

/** a + b (+ c …) = d with at least 3 number cards. */
export const isEquation = (values: number[]) => {
  if (values.length < 3) return false;
  const sorted = [...values].sort((a, b) => a - b);
  const max = sorted[sorted.length - 1];
  return sorted.slice(0, -1).reduce((x, y) => x + y, 0) === max;
};

export type Selection = 'action' | 'single' | 'pair' | 'equation' | 'invalid';

export const classify = (s: SsState, cards: number[]): Selection => {
  if (cards.length === 0) return 'invalid';
  if (cards.length === 1) {
    const kind = kindOf(cards[0]);
    if (kind === 'number' || kind === 'wachhund' || kind === 'trommel') return 'single';
    return canPlayAction(s, cards[0]) ? 'action' : 'invalid';
  }
  if (!cards.every(isNumber)) return 'invalid';
  const values = cards.map(valueOf);
  if (cards.length === 2) return values[0] === values[1] ? 'pair' : 'invalid';
  return isEquation(values) ? 'equation' : 'invalid';
};

export const opponentsWithAnimals = (s: SsState, actor: number) =>
  s.players.map((p, i) => (i !== actor && p.animals.length > 0 ? i : -1)).filter((i) => i >= 0);

export const canPlayAction = (s: SsState, card: number) => {
  switch (kindOf(card)) {
    case 'wecker':
      return sleepingSpots(s).length > 0;
    case 'dieb':
    case 'schlaflied':
      return opponentsWithAnimals(s, s.active).length > 0;
    case 'clown':
      return true;
    default:
      return false;
  }
};

/** Who has to act right now (for bots and pass-and-play prompts). */
export const whoActs = (s: SsState): number => {
  if (s.phase === 'chooseSleeping') return s.pending?.chooser ?? s.active;
  if (s.phase === 'counter') return s.pending?.target?.player ?? s.active;
  return s.active;
};

const rand = (s: SsState): [number, SsState] => {
  const [v, seed] = nextRandom(s.rngSeed);
  return [v, { ...s, rngSeed: seed }];
};

const withEvent = (s: SsState, event: SsEvent): SsState => ({ ...s, lastEvent: event, eventId: s.eventId + 1 });

const drawOne = (s: SsState): [number | null, SsState] => {
  let next = s;
  if (next.deck.length === 0) {
    if (next.discard.length === 0) return [null, next];
    const [deck, seed] = shuffle(next.discard, next.rngSeed);
    next = { ...next, deck, discard: [], rngSeed: seed };
  }
  const [card, ...deck] = next.deck;
  return [card, { ...next, deck }];
};

const giveCards = (s: SsState, player: number, n: number): SsState => {
  let next = s;
  for (let i = 0; i < n; i++) {
    const [card, after] = drawOne(next);
    if (card === null) break;
    next = { ...after, players: after.players.map((p, k) => (k === player ? { ...p, hand: [...p.hand, card] } : p)) };
  }
  return next;
};

const removeFromHand = (s: SsState, player: number, cards: number[]): SsState => ({
  ...s,
  players: s.players.map((p, i) => (i === player ? { ...p, hand: p.hand.filter((c) => !cards.includes(c)) } : p)),
  discard: [...s.discard, ...cards],
});

const checkWinner = (s: SsState): SsState => {
  const winner = s.players.findIndex((p) => p.animals.length >= s.preset.winAnimals || points(p) >= s.preset.winPoints);
  if (winner >= 0) return { ...s, phase: 'over', winner, pending: null, selected: [] };
  if (sleepingSpots(s).length === 0) {
    const best = s.players.reduce((b, p, i) => (points(p) > points(s.players[b]) ? i : b), 0);
    return { ...s, phase: 'over', winner: best, pending: null, selected: [] };
  }
  return s;
};

const endTurn = (state: SsState): SsState => {
  let s = checkWinner(state);
  if (s.phase === 'over') return s;
  const need = HAND_SIZE - s.players[s.active].hand.length;
  s = giveCards(s, s.active, Math.max(0, need));
  const active = (s.active + 1) % s.players.length;
  const humans = s.players.filter((p) => p.kind === 'human').length;
  return { ...s, active, phase: 'turn', pending: null, selected: [], handoff: humans > 1 && s.players[active].kind === 'human' };
};

const moveAnimal = (s: SsState, from: number, to: number, animal: number): SsState => ({
  ...s,
  players: s.players.map((p, i) =>
    i === from ? { ...p, animals: p.animals.filter((a) => a !== animal) } : i === to ? { ...p, animals: [...p.animals, animal] } : p,
  ),
});

const resolveTarget = (s: SsState): SsState => {
  const { card, actor, target } = s.pending!;
  let next = removeFromHand(s, actor, [card]);
  if (kindOf(card) === 'dieb') {
    next = withEvent(moveAnimal(next, target!.player, actor, target!.animal), { type: 'steal', from: target!.player, to: actor, animal: target!.animal });
  } else {
    const spot = next.castle.findIndex((a) => a === null);
    next = {
      ...next,
      castle: next.castle.map((a, i) => (i === spot ? target!.animal : a)),
      players: next.players.map((p, i) => (i === target!.player ? { ...p, animals: p.animals.filter((a) => a !== target!.animal) } : p)),
    };
    next = withEvent(next, { type: 'sleep', player: target!.player, animal: target!.animal });
  }
  return endTurn(next);
};

// ---------- reducer ----------

export const reduce = (s: SsState, a: SsAction): SsState => {
  if (s.phase === 'over') return s;
  if (a.type === 'HANDOFF_DONE') return s.handoff ? { ...s, handoff: false } : s;
  if (s.handoff) return s;
  if (a.type === 'BOT_STEP') return botStep(s);

  switch (a.type) {
    case 'SELECT': {
      if (s.phase !== 'turn' || !s.players[s.active].hand.includes(a.card)) return s;
      const selected = s.selected.includes(a.card) ? s.selected.filter((c) => c !== a.card) : [...s.selected, a.card];
      return { ...s, selected };
    }
    case 'PLAY_SELECTED': {
      if (s.phase !== 'turn') return s;
      const kind = classify(s, s.selected);
      if (kind === 'invalid') return s;
      const actor = s.active;
      if (kind !== 'action') {
        const next = removeFromHand(s, actor, s.selected);
        const stats = kind === 'equation' ? { equations: s.stats.equations.map((n, i) => (i === actor ? n + 1 : n)) } : s.stats;
        return endTurn(withEvent({ ...next, stats, selected: [] }, { type: 'discard', player: actor, cards: s.selected, kind }));
      }
      const card = s.selected[0];
      switch (kindOf(card)) {
        case 'wecker':
          return { ...s, phase: 'chooseSleeping', pending: { card, actor, chooser: actor }, selected: [] };
        case 'dieb':
        case 'schlaflied':
          return { ...s, phase: 'chooseTarget', pending: { card, actor }, selected: [] };
        case 'clown': {
          let next = removeFromHand(s, actor, [card]);
          const [revealed, afterDraw] = drawOne(next);
          next = { ...afterDraw, selected: [] };
          if (revealed === null) return endTurn(next);
          if (!isNumber(revealed)) {
            // An action card: keep it and play again.
            next = { ...next, players: next.players.map((p, i) => (i === actor ? { ...p, hand: [...p.hand, revealed] } : p)) };
            return withEvent({ ...next, phase: 'turn' }, { type: 'clown', player: actor, card: revealed });
          }
          const chooser = (actor + valueOf(revealed) - 1) % s.players.length;
          next = withEvent({ ...next, discard: [...next.discard, revealed] }, { type: 'clown', player: actor, card: revealed, chooser });
          if (sleepingSpots(next).length === 0) return endTurn(next);
          return { ...next, phase: 'chooseSleeping', pending: { card, actor, chooser, revealed } };
        }
        default:
          return s;
      }
    }
    case 'CANCEL': {
      // Taking back an action before a choice was made (not after the clown revealed a card).
      if ((s.phase === 'chooseSleeping' || s.phase === 'chooseTarget') && s.pending && s.pending.revealed === undefined) {
        return { ...s, phase: 'turn', pending: null, selected: [] };
      }
      return s;
    }
    case 'CHOOSE_SLEEPING': {
      if (s.phase !== 'chooseSleeping' || !s.pending) return s;
      const animal = s.castle[a.spot];
      if (animal === null || animal === undefined) return s;
      const { chooser = s.active, card, revealed } = s.pending;
      let next: SsState = {
        ...s,
        castle: s.castle.map((x, i) => (i === a.spot ? null : x)),
        players: s.players.map((p, i) => (i === chooser ? { ...p, animals: [...p.animals, animal] } : p)),
      };
      if (revealed === undefined) next = removeFromHand(next, s.pending.actor, [card]);
      next = withEvent(next, { type: 'wake', player: chooser, animal, by: revealed === undefined ? 'wecker' : 'clown' });
      return endTurn(next);
    }
    case 'CHOOSE_TARGET': {
      if (s.phase !== 'chooseTarget' || !s.pending) return s;
      if (a.player === s.pending.actor || !s.players[a.player]?.animals.includes(a.animal)) return s;
      const pending = { ...s.pending, target: { player: a.player, animal: a.animal } };
      const counter = COUNTER[kindOf(s.pending.card)]!;
      const canBlock = s.players[a.player].hand.some((c) => kindOf(c) === counter);
      const next = { ...s, pending };
      return canBlock ? { ...next, phase: 'counter' } : resolveTarget(next);
    }
    case 'COUNTER': {
      if (s.phase !== 'counter' || !s.pending?.target) return s;
      if (!a.use) return resolveTarget(s);
      const defender = s.pending.target.player;
      const counterKind = COUNTER[kindOf(s.pending.card)]!;
      const counterCard = s.players[defender].hand.find((c) => kindOf(c) === counterKind);
      if (counterCard === undefined) return resolveTarget(s);
      let next = removeFromHand(s, s.pending.actor, [s.pending.card]);
      next = removeFromHand(next, defender, [counterCard]);
      next = giveCards(next, defender, 1);
      next = withEvent(next, { type: 'blocked', defender, with: counterKind as 'wachhund' | 'trommel' });
      return endTurn(next);
    }
    default:
      return s;
  }
};

// ---------- bots (computeBotMove) ----------

const subsets = (cards: number[]) => {
  const out: number[][] = [];
  for (let m = 1; m < 1 << cards.length; m++) out.push(cards.filter((_, i) => m & (1 << i)));
  return out;
};

/** Best equation the bot level can see: mittel only a + b = c, clever any length (largest first). */
export const findEquation = (hand: number[], level: BotLevel): number[] | null => {
  if (level === 'anfaenger') return null;
  const nums = hand.filter(isNumber);
  const candidates = subsets(nums)
    .filter((sub) => (level === 'mittel' ? sub.length === 3 : sub.length >= 3))
    .filter((sub) => isEquation(sub.map(valueOf)))
    .sort((x, y) => y.length - x.length);
  return candidates[0] ?? null;
};

export const findPair = (hand: number[]) => {
  const nums = hand.filter(isNumber);
  for (let i = 0; i < nums.length; i++)
    for (let j = i + 1; j < nums.length; j++) if (valueOf(nums[i]) === valueOf(nums[j])) return [nums[i], nums[j]];
  return null;
};

export const botChooseCards = (s: SsState, random: number): number[] => {
  const hand = s.players[s.active].hand;
  const of = (k: CardKind) => hand.find((c) => kindOf(c) === k);
  const bestOpp = Math.max(0, ...opponentsWithAnimals(s, s.active).flatMap((i) => s.players[i].animals.map((x) => ANIMALS[x].points)));
  const order: CardKind[] = s.botLevel === 'clever' && bestOpp >= 10 ? ['dieb', 'wecker', 'schlaflied', 'clown'] : ['wecker', 'dieb', 'schlaflied', 'clown'];
  for (const k of order) {
    const c = of(k);
    if (c !== undefined && canPlayAction(s, c)) return [c];
  }
  const eq = findEquation(hand, s.botLevel);
  if (eq) return eq;
  const pair = findPair(hand);
  if (pair) return pair;
  const nums = hand.filter(isNumber);
  if (nums.length) {
    if (s.botLevel === 'anfaenger') return [nums[Math.floor(random * nums.length) % nums.length]];
    return [nums.sort((x, y) => valueOf(y) - valueOf(x))[0]];
  }
  return [hand[0]];
};

const botStep = (state: SsState): SsState => {
  const actorIndex = whoActs(state);
  if (state.players[actorIndex]?.kind !== 'bot') return state;
  let [r, s] = rand(state);
  switch (s.phase) {
    case 'turn':
      return reduce({ ...s, selected: botChooseCards(s, r) }, { type: 'PLAY_SELECTED' });
    case 'chooseSleeping': {
      const spots = sleepingSpots(s);
      return reduce(s, { type: 'CHOOSE_SLEEPING', spot: spots[Math.floor(r * spots.length) % spots.length] });
    }
    case 'chooseTarget': {
      const targets = opponentsWithAnimals(s, s.pending!.actor).flatMap((p) => s.players[p].animals.map((animal) => ({ player: p, animal })));
      const pick =
        s.botLevel === 'clever'
          ? targets.sort((x, y) => ANIMALS[y.animal].points - ANIMALS[x.animal].points)[0]
          : targets[Math.floor(r * targets.length) % targets.length];
      return reduce(s, { type: 'CHOOSE_TARGET', ...pick });
    }
    case 'counter': {
      [r, s] = rand(s);
      const use = s.botLevel === 'anfaenger' ? r < 0.7 : true;
      return reduce(s, { type: 'COUNTER', use });
    }
    default:
      return s;
  }
};
