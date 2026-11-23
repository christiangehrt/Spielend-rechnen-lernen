import type { TutorialStep } from '../../core/types/game';
import type { BbState } from './types';

export const tutorial = (_s: BbState): TutorialStep[] => [
  { target: '.bb__stage', say: 'Gleich blitzen hier Punkte auf. Schau ganz genau hin!' },
  { target: '.bb__pad', say: 'Dann tippst du, wie viele Punkte es waren.' },
  { target: '.bb__stage', say: 'Tipp: Fünf Punkte stehen immer in einer Reihe. So erkennst du sie ganz schnell.' },
  { target: '.bb__progress', say: 'Jeder grüne Punkt ist eine richtige Antwort.' },
];
