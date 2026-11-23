import type { TutorialStep } from '../../core/types/game';
import type { BfState } from './types';

export const tutorial = (s: BfState): TutorialStep[] => {
  const split = s.players.every((p) => p.kind === 'human');
  const scope = split ? '.bf-half:not(.bf-half--rot) ' : '';
  return [
    { target: `${scope}.bf__stack`, say: 'Tippe auf deinen Stapel, wenn er leuchtet. Dann deckst du eine Karte auf.' },
    { target: `${scope}.bf__cards`, say: 'Zähle die Früchte von einer Sorte zusammen.' },
    { target: `${scope}.bf__buzzer`, say: 'Sind es genau fünf, drücke ganz schnell den Blitz!' },
    { target: `${scope}.bf__buzzer`, say: 'Aber nur bei genau fünf! Sonst musst du eine Karte abgeben.' },
  ];
};
