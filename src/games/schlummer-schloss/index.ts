import { BOT_AVATARS, BOT_NAMES } from '../../core/bots/bots';
import type { GameModule } from '../../core/types/game';
import { createGame, points, reduce } from './engine';
import { meta } from './meta';
import { tutorial } from './tutorial';
import { SchlummerSchlossView } from './SchlummerSchlossView';
import type { SsAction, SsPresetId, SsState } from './types';

const module: GameModule<SsState, SsAction> = {
  meta,
  stateVersion: 1,
  presets: [
    { id: 'junior', label: '4 Tiere', art: 'level.junior', level: 'junior', speech: 'Vier Tiere oder vierzig Punkte gewinnen' },
    { id: 'profi', label: '5 Tiere', art: 'level.profi', level: 'profi', speech: 'Profi: fünf Tiere oder fünfzig Punkte' },
  ],
  modes: [
    { id: 'bot', players: 1, bots: 1, art: 'mode.bot', speech: 'Gegen den Roboter' },
    { id: 'versus', players: 2, bots: 0, art: 'mode.versus', speech: 'Zu zweit' },
  ],
  defaultPresetId: (range) => (range === 100 ? 'profi' : 'junior'),
  create: (setup) =>
    createGame({
      presetId: setup.presetId as SsPresetId,
      humans: setup.playerNames.map((name, i) => ({ name, avatarId: setup.playerAvatars?.[i] ?? 'avatar.fox' })),
      bots: setup.mode === 'bot' ? [{ name: BOT_NAMES[0], avatarId: BOT_AVATARS[0] }] : [],
      botLevel: setup.botLevel ?? 'anfaenger',
      seed: setup.seed,
    }),
  reduce,
  tutorial,
  canUndo: () => false,
  hasUndo: false,
  undoAction: { type: 'CANCEL' },
  resultDelayMs: 1800,
  result: (s) => {
    if (s.phase !== 'over') return null;
    return {
      won: s.winner === 0,
      strategyEvents: s.stats.equations[0] > 0 ? ['STRATEGY_EQUATION_BUILT'] : [],
      summary: s.players.map((p) => ({ art: p.avatarId, value: String(points(p)) })),
    };
  },
  View: SchlummerSchlossView,
};

export default module;
