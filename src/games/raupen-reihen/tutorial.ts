import type { TutorialStep } from '../../core/types/game';
import type { RrState } from './types';

export const tutorial = (s: RrState): TutorialStep[] => [
  { target: '.rrw__cards .ncard', say: 'Wähle eine Karte aus …' },
  { target: 'button[aria-label="Karte legen"]', say: '… und drücke den Haken. Die anderen wählen auch eine Karte.' },
  { target: '.rrw__rows', say: 'Jede Karte kommt an die Raupe mit der nächstkleineren Zahl.' },
  { target: '.rrw-seg--danger', say: 'Wer die sechste Karte anlegt, muss die ganze Raupe nehmen.' },
  {
    target: '.rrw__players',
    say: s.preset.scoring === 'one' ? 'Wer am Ende die wenigsten Raupen-Karten hat, gewinnt.' : 'Wer am Ende die wenigsten Punkte hat, gewinnt.',
  },
];
