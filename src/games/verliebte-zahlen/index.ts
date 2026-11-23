import type { GameModule } from '../../core/types/game';
import { canUndo, collectedCount, createGame, isOver, reduce } from './engine';
import { meta } from './meta';
import { tutorial } from './tutorial';
import type { VzAction, VzPresetId, VzState } from './types';
import { VerliebteZahlenView } from './VerliebteZahlenView';

const module: GameModule<VzState, VzAction> = {
  meta,
  stateVersion: 1,
  presets: [
    { id: 'raster20', label: '20', art: 'level.junior', level: 'junior', speech: 'Zwanzig Kärtchen' },
    { id: 'raster40', label: '40', art: 'level.mittel', level: 'profi', speech: 'Vierzig Kärtchen mit Elster' },
    { id: 'raster100', label: '100', art: 'level.profi', level: 'profi', speech: 'Profi: hundert Kärtchen mit Elster' },
  ],
  modes: [{ id: 'solo', players: 1, art: 'mode.solo', speech: 'Alleine spielen' }],
  defaultPresetId: (range) => (range === 100 ? 'raster40' : 'raster20'),
  create: (setup) => createGame(setup.presetId as VzPresetId, setup.seed),
  reduce,
  tutorial,
  canUndo,
  undoAction: { type: 'UNDO' },
  resultDelayMs: 1400,
  result: (s) => {
    if (!isOver(s)) return null;
    const left = s.tiles.filter((t) => t.state === 'open' && t.value !== 'magpie').length;
    return {
      won: left === 0,
      score: left,
      strategyEvents: s.stats.multiSets > 0 ? ['STRATEGY_MULTI_SPLIT'] : [],
      summary: [
        { art: 'ui.basket', value: String(collectedCount(s)) },
        ...(s.stats.stolenTiles > 0 ? [{ art: 'ui.magpie', value: String(s.stats.stolenTiles) }] : []),
      ],
    };
  },
  View: VerliebteZahlenView,
};

export default module;
