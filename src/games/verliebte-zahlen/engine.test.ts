import { describe, expect, it } from 'vitest';
import { buildValues, collectedCount, createGame, hint, isOver, reduce, selectedSum } from './engine';
import type { Tile, VzState } from './types';

const withTiles = (values: (number | 'magpie')[], states?: Tile['state'][]): VzState => ({
  ...createGame('raster20', 1),
  tiles: values.map((value, id) => ({ id, value, state: states?.[id] ?? 'open' })),
});

describe('setup', () => {
  it('builds 20 tiles of complementary pairs for the junior grid (no magpies)', () => {
    const v = buildValues('raster20');
    expect(v).toHaveLength(20);
    expect(v).not.toContain('magpie');
    const nums = v as number[];
    for (let a = 1; a <= 9; a++) expect(nums.filter((x) => x === a).length).toBe(nums.filter((x) => x === 10 - a).length);
  });

  it('fills the profi grids exactly incl. magpies', () => {
    expect(buildValues('raster40')).toHaveLength(40);
    expect(buildValues('raster100')).toHaveLength(100);
    expect(buildValues('raster100').filter((x) => x === 'magpie')).toHaveLength(10);
  });

  it('starts with all tiles hidden', () => {
    const s = createGame('raster20', 9);
    expect(s.tiles.every((t) => t.state === 'hidden')).toBe(true);
  });
});

describe('flipping & collecting', () => {
  it('flips a hidden tile which stays open', () => {
    let s = createGame('raster20', 2);
    s = reduce(s, { type: 'FLIP', tileId: 0 });
    expect(s.tiles[0].state).toBe('open');
    expect(reduce(s, { type: 'FLIP', tileId: 0 })).toBe(s);
  });

  it('collects open tiles that add up to exactly 10', () => {
    let s = withTiles([3, 7, 5, 4]);
    s = reduce(s, { type: 'TOGGLE', tileId: 0 });
    expect(selectedSum(s)).toBe(3);
    s = reduce(s, { type: 'TOGGLE', tileId: 1 });
    expect(s.basket).toEqual([[0, 1]]);
    expect(collectedCount(s)).toBe(2);
    expect(s.selected).toEqual([]);
  });

  it('accepts sets of three tiles (multi split) and rejects sums over 10', () => {
    let s = withTiles([2, 3, 5, 9]);
    s = reduce(s, { type: 'TOGGLE', tileId: 3 });
    expect(reduce(s, { type: 'TOGGLE', tileId: 1 })).toBe(s); // 9 + 3 > 10
    s = reduce(s, { type: 'TOGGLE', tileId: 3 }); // deselect
    for (const id of [0, 1, 2]) s = reduce(s, { type: 'TOGGLE', tileId: id });
    expect(s.basket).toEqual([[0, 1, 2]]);
    expect(s.stats.multiSets).toBe(1);
  });

  it('cannot select hidden tiles', () => {
    const s = withTiles([3, 7], ['hidden', 'open']);
    expect(reduce(s, { type: 'TOGGLE', tileId: 0 })).toBe(s);
  });
});

describe('magpie (profi)', () => {
  it('steals the last collected set', () => {
    let s = withTiles([1, 9, 4, 6, 'magpie'], ['open', 'open', 'open', 'open', 'hidden']);
    s = reduce(reduce(s, { type: 'TOGGLE', tileId: 0 }), { type: 'TOGGLE', tileId: 1 });
    s = reduce(reduce(s, { type: 'TOGGLE', tileId: 2 }), { type: 'TOGGLE', tileId: 3 });
    s = reduce(s, { type: 'FLIP', tileId: 4 });
    expect(s.basket).toEqual([[0, 1]]);
    expect(s.tiles[2].state).toBe('stolen');
    expect(s.tiles[4].state).toBe('gone');
    expect(s.lastStolen).toEqual([2, 3]);
  });

  it('flies away when the basket is empty', () => {
    let s = withTiles(['magpie', 3], ['hidden', 'hidden']);
    s = reduce(s, { type: 'FLIP', tileId: 0 });
    expect(s.tiles[0].state).toBe('gone');
    expect(s.lastStolen).toEqual([]);
  });
});

describe('undo, hint and end', () => {
  it('undoes a collect but never a flip', () => {
    let s = withTiles([3, 7, 2], ['open', 'open', 'hidden']);
    s = reduce(reduce(s, { type: 'TOGGLE', tileId: 0 }), { type: 'TOGGLE', tileId: 1 });
    const undone = reduce(s, { type: 'UNDO' });
    expect(undone.basket).toEqual([]);
    expect(undone.tiles[0].state).toBe('open');
    const flipped = reduce(s, { type: 'FLIP', tileId: 2 });
    expect(reduce(flipped, { type: 'UNDO' })).toBe(flipped);
  });

  it('suggests a combination that makes 10', () => {
    const s = withTiles([1, 4, 6, 8]);
    const ids = hint(s)!;
    expect(ids.map((id) => s.tiles[id].value as number).reduce((a, b) => a + b, 0)).toBe(10);
  });

  it('is over when nothing is hidden and no 10 can be made', () => {
    expect(isOver(withTiles([9, 8, 3]))).toBe(true);
    expect(isOver(withTiles([9, 1]))).toBe(false);
    expect(isOver(withTiles([9, 8], ['open', 'hidden']))).toBe(false);
  });
});
