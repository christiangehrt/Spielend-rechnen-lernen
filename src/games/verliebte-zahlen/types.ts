export type VzPresetId = 'raster20' | 'raster40' | 'raster100';

export interface VzPreset {
  id: VzPresetId;
  cols: number;
  rows: number;
  /** How often each pair type (1+9, 2+8, 3+7, 4+6) appears; 5+5 appears pairsOfFive times. */
  pairsEach: number;
  pairsOfFive: number;
  magpies: number;
}

export type TileValue = number | 'magpie';

export interface Tile {
  id: number;
  value: TileValue;
  state: 'hidden' | 'open' | 'collected' | 'stolen' | 'gone';
}

export interface VzState {
  preset: VzPreset;
  tiles: Tile[];
  selected: number[]; // tile ids
  basket: number[][]; // collected sets (tile ids), newest last
  /** Set ids taken by the magpie on the most recent flip (for the animation). */
  lastStolen: number[] | null;
  history: Omit<VzState, 'history'>[]; // undo of collects since the last flip
  stats: { flips: number; multiSets: number; stolenTiles: number };
}

export type VzAction = { type: 'FLIP'; tileId: number } | { type: 'TOGGLE'; tileId: number } | { type: 'UNDO' };
