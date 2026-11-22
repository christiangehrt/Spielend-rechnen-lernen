import { popHistory, pushHistory } from '../../core/history';
import { shuffle } from '../../core/random/rng';
import { canMakeSum, findSubset } from '../../core/subsetSum';
import { PRESETS } from './presets';
import type { Tile, TileValue, VzAction, VzPresetId, VzState } from './types';

export const TARGET = 10;

export const buildValues = (presetId: VzPresetId): TileValue[] => {
  const p = PRESETS[presetId];
  const values: TileValue[] = [];
  for (const a of [1, 2, 3, 4]) for (let i = 0; i < p.pairsEach; i++) values.push(a, TARGET - a);
  for (let i = 0; i < p.pairsOfFive; i++) values.push(5, 5);
  for (let i = 0; i < p.magpies; i++) values.push('magpie');
  return values;
};

export const createGame = (presetId: VzPresetId, seed: number): VzState => {
  const preset = PRESETS[presetId] ?? PRESETS.raster20;
  const [values] = shuffle(buildValues(preset.id), seed);
  return {
    preset,
    tiles: values.map((value, id) => ({ id, value, state: 'hidden' })),
    selected: [],
    basket: [],
    lastStolen: null,
    history: [],
    stats: { flips: 0, multiSets: 0, stolenTiles: 0 },
  };
};

const numberValue = (t: Tile) => (typeof t.value === 'number' ? t.value : 0);
export const selectedSum = (s: VzState) =>
  s.selected.reduce((sum, id) => sum + numberValue(s.tiles[id]), 0);

export const openNumberTiles = (s: VzState) => s.tiles.filter((t) => t.state === 'open' && typeof t.value === 'number');
export const hiddenCount = (s: VzState) => s.tiles.filter((t) => t.state === 'hidden').length;
export const collectedCount = (s: VzState) => s.tiles.filter((t) => t.state === 'collected').length;

/** Round ends when nothing is hidden and no open tiles can make 10 any more. */
export const isOver = (s: VzState) =>
  hiddenCount(s) === 0 && !canMakeSum(openNumberTiles(s).map(numberValue), TARGET);

/** Tile ids of one combination that makes 10 (for the hint button). */
export const hint = (s: VzState): number[] | null => {
  const open = openNumberTiles(s);
  const values = findSubset(
    open.map(numberValue),
    TARGET,
  );
  if (!values) return null;
  const ids: number[] = [];
  const pool = [...open];
  for (const v of values) {
    const i = pool.findIndex((t) => t.value === v);
    ids.push(pool[i].id);
    pool.splice(i, 1);
  }
  return ids;
};

export const reduce = (s: VzState, a: VzAction): VzState => {
  if (a.type === 'UNDO') return s.history.length ? popHistory(s) : s;
  if (isOver(s)) return s;
  const tile = s.tiles[a.tileId];
  if (!tile) return s;

  if (a.type === 'FLIP') {
    if (tile.state !== 'hidden') return s;
    if (tile.value === 'magpie') {
      // The magpie steals the most recently collected set (if any) and flies away.
      const stolen = s.basket[s.basket.length - 1] ?? null;
      const tiles = s.tiles.map((t) =>
        t.id === tile.id ? { ...t, state: 'gone' as const } : stolen?.includes(t.id) ? { ...t, state: 'stolen' as const } : t,
      );
      return {
        ...s,
        tiles,
        basket: stolen ? s.basket.slice(0, -1) : s.basket,
        lastStolen: stolen ?? [],
        history: [],
        stats: { ...s.stats, flips: s.stats.flips + 1, stolenTiles: s.stats.stolenTiles + (stolen?.length ?? 0) },
      };
    }
    return {
      ...s,
      tiles: s.tiles.map((t) => (t.id === tile.id ? { ...t, state: 'open' as const } : t)),
      lastStolen: null,
      history: [], // flips reveal information and cannot be undone
      stats: { ...s.stats, flips: s.stats.flips + 1 },
    };
  }

  // TOGGLE
  if (tile.state !== 'open' || typeof tile.value !== 'number') return s;
  if (s.selected.includes(tile.id)) return { ...s, selected: s.selected.filter((id) => id !== tile.id) };
  const total = selectedSum(s) + tile.value;
  if (total > TARGET) return s;
  const selected = [...s.selected, tile.id];
  if (total < TARGET) return { ...s, selected };
  // Exactly 10: the set moves into the basket.
  return {
    ...s,
    history: pushHistory<VzState>({ ...s, selected: [] }),
    tiles: s.tiles.map((t) => (selected.includes(t.id) ? { ...t, state: 'collected' as const } : t)),
    selected: [],
    basket: [...s.basket, selected],
    lastStolen: null,
    stats: { ...s.stats, multiSets: s.stats.multiSets + (selected.length >= 3 ? 1 : 0) },
  };
};

export const canUndo = (s: VzState) => s.history.length > 0;
