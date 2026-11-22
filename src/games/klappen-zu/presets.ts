import type { KlappenPreset, KlappenPresetId } from './types';

export const PRESETS: Record<KlappenPresetId, KlappenPreset> = {
  klappen6: { id: 'klappen6', maxFlap: 6, fixedDice: 1 },
  klappen9: { id: 'klappen9', maxFlap: 9, fixedDice: null },
  klappen12: { id: 'klappen12', maxFlap: 12, fixedDice: null },
};
