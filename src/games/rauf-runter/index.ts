import type { GameModule } from '../../core/types/game';
import { canUndo, createGame, reduce, remainingCards } from './engine';
import { meta } from './meta';
import { RaufRunterView } from './RaufRunterView';
import type { GamePresetId, TheGameAction, TheGameState } from './types';

const AVATARS = ['avatar.fox', 'avatar.bear', 'avatar.owl', 'avatar.cat'];

const module: GameModule<TheGameState, TheGameAction> = {
  meta,
  stateVersion: 1,
  presets: [
    { id: 'zr20', label: '1–20', art: 'level.junior', level: 'junior', speech: 'Zahlen bis zwanzig' },
    { id: 'zr50', label: '1–50', art: 'level.mittel', level: 'profi', speech: 'Zahlen bis fünfzig' },
    { id: 'original100', label: '1–100', art: 'level.profi', level: 'profi', speech: 'Profi: Zahlen bis hundert' },
  ],
  modes: [
    { id: 'solo', players: 1, art: 'mode.solo', speech: 'Alleine spielen' },
    { id: 'coop', players: 2, art: 'mode.coop', speech: 'Zu zweit zusammen spielen' },
  ],
  defaultPresetId: (range) => (range === 100 ? 'original100' : 'zr20'),
  create: (setup) =>
    createGame({
      presetId: setup.presetId as GamePresetId,
      mode: setup.mode === 'coop' ? 'coop' : 'solo',
      players: setup.playerNames.map((name, i) => ({ name, avatarId: setup.playerAvatars?.[i] ?? AVATARS[i % AVATARS.length] })),
      seed: setup.seed,
    }),
  reduce,
  canUndo,
  undoAction: { type: 'UNDO' },
  result: (s) => {
    if (s.status === 'playing') return null;
    const left = remainingCards(s);
    return {
      won: s.status === 'won',
      score: left,
      strategyEvents: s.stats.reverseJumpsUsed > 0 ? ['STRATEGY_REVERSE_JUMP'] : [],
      summary: s.status === 'won' ? [] : [{ art: 'ui.cards', value: String(left), speech: `${left} Karten übrig` }],
    };
  },
  View: RaufRunterView,
};

export default module;
