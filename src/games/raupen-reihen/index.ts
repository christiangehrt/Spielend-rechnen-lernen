import { BOT_AVATARS, BOT_NAMES } from '../../core/bots/bots';
import type { GameModule } from '../../core/types/game';
import { createGame, playerPoints, reduce } from './engine';
import { meta } from './meta';
import { RaupenReihenView } from './RaupenReihenView';
import type { RrAction, RrPresetId, RrState } from './types';

const module: GameModule<RrState, RrAction> = {
  meta,
  stateVersion: 1,
  presets: [
    { id: 'zr30', label: '1–30', art: 'level.junior', level: 'junior', speech: 'Zahlen bis dreißig' },
    { id: 'original104', label: '1–104', art: 'level.profi', level: 'profi', speech: 'Profi: Zahlen bis hundertvier' },
  ],
  modes: [
    { id: 'bot', players: 1, bots: 2, art: 'mode.bot', speech: 'Gegen zwei Roboter' },
    { id: 'versus', players: 2, bots: 1, art: 'mode.versus', speech: 'Zu zweit und ein Roboter' },
  ],
  defaultPresetId: (range) => (range === 100 ? 'original104' : 'zr30'),
  create: (setup) => {
    const humans = setup.playerNames.map((name, i) => ({ name, avatarId: setup.playerAvatars?.[i] ?? 'avatar.fox' }));
    const botCount = setup.mode === 'versus' ? 1 : 2;
    const bots = Array.from({ length: botCount }, (_, i) => ({ name: BOT_NAMES[i], avatarId: BOT_AVATARS[i] }));
    return createGame({
      presetId: setup.presetId as RrPresetId,
      humans,
      bots,
      botLevel: setup.botLevel ?? 'anfaenger',
      seed: setup.seed,
    });
  },
  reduce,
  canUndo: () => false,
  hasUndo: false,
  undoAction: { type: 'HANDOFF_DONE' },
  resultDelayMs: 1500,
  result: (s) => {
    if (s.phase !== 'over') return null;
    const mine = playerPoints(s, 0);
    const best = Math.min(...s.players.map((_, i) => playerPoints(s, i)));
    return {
      won: mine === best,
      score: mine,
      strategyEvents: [],
      summary: s.players.map((p, i) => ({ art: p.avatarId, value: String(playerPoints(s, i)) })),
    };
  },
  View: RaupenReihenView,
};

export default module;
