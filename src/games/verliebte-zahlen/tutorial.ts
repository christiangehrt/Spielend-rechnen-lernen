import type { TutorialStep } from '../../core/types/game';
import type { VzState } from './types';

export const tutorial = (s: VzState): TutorialStep[] => {
  const hidden = s.tiles.find((t) => t.state === 'hidden');
  const steps: TutorialStep[] = [];
  if (hidden) steps.push({ target: `.vz__grid > .vz-tile:nth-child(${hidden.id + 1})`, say: 'Tippe auf ein Herz. Dann siehst du die Zahl.' });
  steps.push(
    { target: '.vz__sum', say: 'Tippe offene Zahlen an, die zusammen zehn sind. Hier siehst du, wie viele noch bis zehn fehlen.' },
    { target: '.vz__basket', say: 'Verliebte Zahlen wandern in deinen Korb.' },
    { target: '.vz__panel button[aria-label="Tipp"]', say: 'Weißt du nicht weiter? Die Glühbirne zeigt dir ein Paar.' },
  );
  if (s.preset.magpies > 0) steps.push({ target: '.vz__info', say: 'Vorsicht: Die Elster klaut dein letztes Paar!' });
  return steps;
};
