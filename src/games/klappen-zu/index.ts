import type { GameModule } from '../../core/types/game';
import { canUndo, createGame, penalty, reduce } from './engine';
import { KlappenZuView } from './KlappenZuView';
import { meta } from './meta';
import type { KlappenAction, KlappenPresetId, KlappenState } from './types';

const module: GameModule<KlappenState, KlappenAction> = {
  meta,
  stateVersion: 1,
  presets: [
    { id: 'klappen6', label: '1–6', art: 'level.junior', level: 'junior', speech: 'Klappen eins bis sechs, ein Würfel' },
    { id: 'klappen9', label: '1–9', art: 'level.mittel', level: 'junior', speech: 'Klappen eins bis neun, zwei Würfel' },
    { id: 'klappen12', label: '1–12', art: 'level.profi', level: 'profi', speech: 'Profi: Klappen eins bis zwölf' },
  ],
  modes: [{ id: 'solo', players: 1, art: 'mode.solo', speech: 'Alleine spielen' }],
  defaultPresetId: (range) => (range === 10 ? 'klappen6' : range === 100 ? 'klappen12' : 'klappen9'),
  create: (setup) => createGame(setup.presetId as KlappenPresetId, setup.seed),
  reduce,
  canUndo,
  undoAction: { type: 'UNDO' },
  resultDelayMs: 2600,
  result: (s) => {
    if (s.phase !== 'over') return null;
    const points = penalty(s);
    return {
      won: points === 0,
      score: points,
      strategyEvents: s.stats.multiSplits > 0 ? ['STRATEGY_MULTI_SPLIT'] : [],
      summary: [{ art: 'ui.box', value: String(points), speech: `${points} Punkte` }],
    };
  },
  View: KlappenZuView,
};

export default module;
