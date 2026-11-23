import type { GameModule } from '../../core/types/game';
import { createGame, reduce, totalQuestions } from './engine';
import { meta } from './meta';
import { tutorial } from './tutorial';
import type { ZdAction, ZdPresetId, ZdState } from './types';
import { ZahlenDetektivView } from './ZahlenDetektivView';

const module: GameModule<ZdState, ZdAction> = {
  meta,
  stateVersion: 1,
  presets: [
    { id: 'bis10', label: '1–10', art: 'level.junior', level: 'junior', speech: 'Zahlen bis zehn' },
    { id: 'bis20', label: '1–20', art: 'level.mittel', level: 'junior', speech: 'Zahlen bis zwanzig' },
    { id: 'bis50', label: '1–50', art: 'level.mittel', level: 'profi', speech: 'Zahlen bis fünfzig' },
    { id: 'bis100', label: '1–100', art: 'level.profi', level: 'profi', speech: 'Profi: Zahlen bis hundert' },
  ],
  modes: [{ id: 'solo', players: 1, art: 'mode.solo', speech: 'Alleine spielen' }],
  defaultPresetId: (range) => (range === 10 ? 'bis10' : range === 100 ? 'bis100' : 'bis20'),
  create: (setup) => createGame(setup.presetId as ZdPresetId, setup.seed),
  reduce,
  tutorial,
  canUndo: () => false,
  hasUndo: false,
  undoAction: { type: 'CLEAR_DRAFT' },
  resultDelayMs: 200,
  result: (s) => {
    if (s.phase !== 'over') return null;
    const total = totalQuestions(s);
    return {
      won: total <= s.preset.goodQuestions * s.cases.length,
      score: total,
      strategyEvents: s.stats.splits > 0 ? ['STRATEGY_INTERVAL_SPLIT'] : [],
      summary: [
        { art: 'game.zahlen-detektiv', value: String(s.cases.length) },
        { art: 'ui.question', value: String(total) },
      ],
    };
  },
  View: ZahlenDetektivView,
};

export default module;
