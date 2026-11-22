import type { GameModule } from '../../core/types/game';
import { bridgedCount, canUndo, createGame, crossingCount, reduce } from './engine';
import { meta } from './meta';
import type { ZhAction, ZhPresetId, ZhState } from './types';
import { ZahlenstrahlView } from './ZahlenstrahlView';

const module: GameModule<ZhState, ZhAction> = {
  meta,
  stateVersion: 1,
  presets: [
    { id: 'plus10', label: '0–10', art: 'level.junior', level: 'junior', speech: 'Plus bis zehn' },
    { id: 'plus20', label: '+ 0–20', art: 'level.mittel', level: 'junior', speech: 'Plus bis zwanzig' },
    { id: 'minus20', label: '− 0–20', art: 'level.mittel', level: 'profi', speech: 'Minus bis zwanzig' },
    { id: 'plus100', label: '0–100', art: 'level.profi', level: 'profi', speech: 'Profi: Plus bis hundert' },
  ],
  modes: [{ id: 'solo', players: 1, art: 'mode.solo', speech: 'Alleine spielen' }],
  defaultPresetId: (range) => (range === 10 ? 'plus10' : range === 100 ? 'plus100' : 'plus20'),
  create: (setup) => createGame(setup.presetId as ZhPresetId, setup.seed),
  reduce,
  canUndo,
  undoAction: { type: 'UNDO' },
  resultDelayMs: 300,
  result: (s) => {
    if (s.phase !== 'over') return null;
    const bridged = bridgedCount(s);
    const crossing = crossingCount(s);
    return {
      // Won when at least half of the ten-crossing tasks used the ten stop (rounds without crossings count as won).
      won: crossing === 0 || bridged >= Math.ceil(crossing / 2),
      strategyEvents: bridged > 0 ? ['STRATEGY_TEN_BRIDGE'] : [],
      summary: [
        { art: 'ui.check', value: String(s.results.length) },
        ...(crossing > 0 ? [{ art: 'game.zahlenstrahl-huepfen', value: `${bridged}/${crossing}` }] : []),
      ],
    };
  },
  View: ZahlenstrahlView,
};

export default module;
