import type { GameMeta } from '../../core/types/game';

export const meta: GameMeta = {
  id: 'nachbar-reihe',
  title: 'Nachbar-Reihe',
  art: 'game.nachbar-reihe',
  color: '#ef476f',
  learningGoals: ['zahlenstrahl', 'vergleichen'],
  intro:
    'Nachbar-Reihe. Jede Farbe beginnt mit der Elf. Danach darfst du nur Nachbarzahlen anlegen: eins weniger links oder eins mehr rechts. Kannst du nichts legen, ziehe eine Karte. Wer zuerst keine Karten mehr hat, gewinnt!',
  phase: 3,
};
