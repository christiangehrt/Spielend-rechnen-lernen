import type { ZhPreset, ZhPresetId } from './types';

export const PRESETS: Record<ZhPresetId, ZhPreset> = {
  plus10: { id: 'plus10', op: '+', max: 10, windowSize: null, tasksPerRound: 6 },
  plus20: { id: 'plus20', op: '+', max: 20, windowSize: null, tasksPerRound: 6 },
  minus20: { id: 'minus20', op: '-', max: 20, windowSize: null, tasksPerRound: 6 },
  plus100: { id: 'plus100', op: '+', max: 100, windowSize: 20, tasksPerRound: 6 },
};
