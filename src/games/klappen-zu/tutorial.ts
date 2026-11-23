import type { TutorialStep } from '../../core/types/game';
import type { KlappenState } from './types';

export const tutorial = (s: KlappenState): TutorialStep[] => {
  const open = s.open.filter((v) => !s.selected.includes(v));
  const [a, b] = open.includes(3) && open.includes(5) ? [3, 5] : open.slice(0, 2);
  const steps: TutorialStep[] = [];
  if (s.phase === 'roll') steps.push({ target: '.kz__actions button', say: 'Tippe auf die Würfel.' });
  else steps.push({ target: '.kz__dice', say: 'So viele Augen zeigen die Würfel zusammen.' });
  if (a !== undefined && b !== undefined) {
    steps.push(
      { target: `button[aria-label="Klappe ${a}"]`, say: `Dann tippst du Klappen an. Zum Beispiel ${a} …` },
      { target: `button[aria-label="Klappe ${b}"]`, say: `… und ${b}. Das sind zusammen ${a + b}.` },
    );
  }
  steps.push(
    {
      target: s.phase === 'select' ? 'button[aria-label="Klappen schließen"]' : '.kz__box',
      say: 'Passt es genau zu den Würfeln, drückst du den Haken. Die Klappen gehen zu.',
    },
    { target: '.kz__box', say: 'Schaffst du es, alle Klappen zu schließen?' },
  );
  return steps;
};
