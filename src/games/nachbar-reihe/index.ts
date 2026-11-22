import { BOT_AVATARS, BOT_NAMES } from '../../core/bots/bots';
import type { GameModule } from '../../core/types/game';
import { createGame, reduce } from './engine';
import { meta } from './meta';
import { NachbarReiheView } from './NachbarReiheView';
import type { NrAction, NrPresetId, NrState } from './types';

const module: GameModule<NrState, NrAction> = {
  meta,
  stateVersion: 1,
  presets: [
    { id: 'farben2', label: '2 Farben', art: 'level.junior', level: 'junior', speech: 'Zwei Farben, kurze Runde' },
    { id: 'farben4', label: '4 Farben', art: 'level.profi', level: 'profi', speech: 'Vier Farben, wie im Original' },
  ],
  modes: [
    { id: 'bot', players: 1, bots: 1, art: 'mode.bot', speech: 'Gegen den Roboter' },
    { id: 'versus', players: 2, bots: 0, art: 'mode.versus', speech: 'Zu zweit' },
  ],
  defaultPresetId: (range) => (range === 100 ? 'farben4' : 'farben2'),
  create: (setup) =>
    createGame({
      presetId: setup.presetId as NrPresetId,
      humans: setup.playerNames.map((name, i) => ({ name, avatarId: setup.playerAvatars?.[i] ?? 'avatar.fox' })),
      bots: setup.mode === 'bot' ? [{ name: BOT_NAMES[0], avatarId: BOT_AVATARS[0] }] : [],
      botLevel: setup.botLevel ?? 'anfaenger',
      seed: setup.seed,
    }),
  reduce,
  canUndo: () => false,
  hasUndo: false,
  undoAction: { type: 'HANDOFF_DONE' },
  resultDelayMs: 1500,
  result: (s) => {
    if (s.phase !== 'over') return null;
    return {
      won: s.winner === 0,
      score: s.players[0].hand.length,
      strategyEvents: [],
      summary: s.players.map((p) => ({ art: p.avatarId, value: String(p.hand.length) })),
    };
  },
  View: NachbarReiheView,
};

export default module;
