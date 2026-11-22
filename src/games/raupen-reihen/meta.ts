import type { GameMeta } from '../../core/types/game';

export const meta: GameMeta = {
  id: 'raupen-reihen',
  title: 'Raupen-Reihen',
  art: 'game.raupen-reihen',
  color: '#7cb342',
  learningGoals: ['vergleichen', 'zahlenstrahl'],
  intro:
    'Raupen-Reihen. Alle wählen geheim eine Karte. Dann kommt jede Karte an die Raupe mit der nächstkleineren Zahl. Wer die sechste Karte an eine Raupe legt, muss die Raupe nehmen. Wer am Ende die wenigsten Punkte hat, gewinnt!',
  phase: 3,
};
