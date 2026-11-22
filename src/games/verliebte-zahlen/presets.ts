import type { VzPreset, VzPresetId } from './types';

// 4 pair types × pairsEach × 2 tiles + pairsOfFive × 2 tiles + magpies = cols × rows
export const PRESETS: Record<VzPresetId, VzPreset> = {
  raster20: { id: 'raster20', cols: 5, rows: 4, pairsEach: 2, pairsOfFive: 2, magpies: 0 },
  raster40: { id: 'raster40', cols: 8, rows: 5, pairsEach: 4, pairsOfFive: 2, magpies: 4 },
  raster100: { id: 'raster100', cols: 10, rows: 10, pairsEach: 9, pairsOfFive: 9, magpies: 10 },
};
