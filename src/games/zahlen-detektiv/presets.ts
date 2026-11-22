import type { ZdPreset, ZdPresetId } from './types';

export const PRESETS: Record<ZdPresetId, ZdPreset> = {
  bis10: { id: 'bis10', max: 10, cases: 3, goodQuestions: 4 },
  bis20: { id: 'bis20', max: 20, cases: 3, goodQuestions: 5 },
  bis50: { id: 'bis50', max: 50, cases: 3, goodQuestions: 7 },
  bis100: { id: 'bis100', max: 100, cases: 3, goodQuestions: 8 },
};
