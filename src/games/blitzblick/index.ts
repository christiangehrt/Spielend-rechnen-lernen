import type { GameModule } from '../../core/types/game';
import { BlitzblickView } from './BlitzblickView';
import { createGame, firstTryCorrect, reduce } from './engine';
import { meta } from './meta';
import { tutorial } from './tutorial';
import type { BbAction, BbPresetId, BbState } from './types';

const module: GameModule<BbState, BbAction> = {
  meta,
  stateVersion: 1,
  presets: [
    { id: 'bis5', label: '1–5', art: 'level.junior', level: 'junior', speech: 'Bis fünf Punkte' },
    { id: 'bis10', label: '1–10', art: 'level.mittel', level: 'junior', speech: 'Bis zehn Punkte' },
    { id: 'bis20', label: '1–20', art: 'level.profi', level: 'profi', speech: 'Profi: bis zwanzig Punkte' },
  ],
  modes: [{ id: 'solo', players: 1, art: 'mode.solo', speech: 'Alleine spielen' }],
  defaultPresetId: (range) => (range === 100 ? 'bis20' : 'bis10'),
  create: (setup) => createGame(setup.presetId as BbPresetId, setup.seed),
  reduce,
  tutorial,
  canUndo: () => false,
  hasUndo: false,
  undoAction: { type: 'NEXT' },
  resultDelayMs: 300,
  result: (s) => {
    if (s.phase !== 'over') return null;
    const ok = firstTryCorrect(s);
    return {
      won: ok >= 8,
      mastered: ok >= 8,
      score: s.answers.length - ok,
      strategyEvents: [],
      insights: s.answers.map((a) => ({ key: `blitzblick:${a.n}`, ok: a.correct })),
      summary: [{ art: 'ui.check', value: `${ok}/${s.answers.length}` }],
    };
  },
  View: BlitzblickView,
};

export default module;
