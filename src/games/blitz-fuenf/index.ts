import { BOT_AVATARS, BOT_NAMES } from '../../core/bots/bots';
import type { GameModule } from '../../core/types/game';
import { BlitzFuenfView } from './BlitzFuenfView';
import { createGame, reduce, totalCards, winnerIndex } from './engine';
import { meta } from './meta';
import { tutorial } from './tutorial';
import type { BfAction, BfState } from './types';

const module: GameModule<BfState, BfAction> = {
  meta,
  stateVersion: 1,
  presets: [{ id: 'ziel5', label: '5', art: 'level.junior', level: 'junior', speech: 'Genau fünf Früchte' }],
  modes: [
    { id: 'bot', players: 1, bots: 1, art: 'mode.bot', speech: 'Gegen den Roboter' },
    { id: 'versus', players: 2, bots: 0, art: 'mode.versus', speech: 'Zu zweit, geteilter Bildschirm' },
  ],
  defaultPresetId: () => 'ziel5',
  create: (setup) =>
    createGame({
      humans: setup.playerNames.map((name, i) => ({ name, avatarId: setup.playerAvatars?.[i] ?? 'avatar.fox' })),
      bots: setup.mode === 'bot' ? [{ name: BOT_NAMES[0], avatarId: BOT_AVATARS[0] }] : [],
      botLevel: setup.botLevel ?? 'anfaenger',
      seed: setup.seed,
    }),
  reduce,
  tutorial,
  canUndo: () => false,
  hasUndo: false,
  undoAction: { type: 'FLIP', player: -1 },
  resultDelayMs: 1800,
  result: (s) => {
    if (s.phase !== 'over') return null;
    const best = totalCards(s.players[winnerIndex(s)]);
    return {
      won: totalCards(s.players[0]) === best,
      strategyEvents: [],
      summary: s.players.map((p) => ({ art: p.avatarId, value: String(totalCards(p)) })),
    };
  },
  View: BlitzFuenfView,
};

export default module;
