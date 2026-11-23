import type { TutorialStep } from '../../core/types/game';
import type { ZdState } from './types';

export const tutorial = (s: ZdState): TutorialStep[] => {
  const mid = Math.round(s.preset.max / 2);
  return [
    { target: '.zd__line', say: `Ich denke mir eine Zahl bis ${s.preset.max}. Finde sie mit Fragen!` },
    { target: 'button[aria-label="Ist sie größer als …?"]', say: 'Tippe zum Beispiel auf „größer als“ …' },
    { target: `.zd__line .zd-num:nth-child(${mid})`, say: `… dann auf eine Zahl, zum Beispiel ${mid} …` },
    { target: 'button[aria-label="Frage stellen"]', say: '… und dann auf das Fragezeichen. Ich sage dir ja oder nein.' },
    { target: '.zd__line', say: 'Zahlen, die es nicht sein können, werden grau.' },
    { target: 'button[aria-label="Ist es genau …?"]', say: 'Weißt du die Zahl? Dann tippe auf die Zielscheibe und auf die Zahl.' },
  ];
};
