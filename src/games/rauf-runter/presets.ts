import type { GamePresetId, TheGamePreset } from './types';

export const PRESETS: Record<GamePresetId, TheGamePreset> = {
  zr20: {
    id: 'zr20',
    label: '1–20',
    minCard: 2,
    maxCard: 19,
    ascendingStarts: [1],
    descendingStarts: [20],
    reverseJumpDelta: 5,
    handSizeSolo: 6,
    handSizeCoop: 5,
  },
  zr50: {
    id: 'zr50',
    label: '1–50',
    minCard: 2,
    maxCard: 49,
    ascendingStarts: [1, 1],
    descendingStarts: [50],
    reverseJumpDelta: 10,
    handSizeSolo: 7,
    handSizeCoop: 6,
  },
  original100: {
    id: 'original100',
    label: '1–100',
    minCard: 2,
    maxCard: 99,
    ascendingStarts: [1, 1],
    descendingStarts: [100, 100],
    reverseJumpDelta: 10,
    handSizeSolo: 8,
    handSizeCoop: 7,
  },
};
