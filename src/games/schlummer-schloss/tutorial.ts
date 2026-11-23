import type { TutorialStep } from '../../core/types/game';
import { kindOf } from './cards';
import type { SsState } from './types';

export const tutorial = (s: SsState): TutorialStep[] => {
  const humanIndex = s.players[s.active].kind === 'human' ? s.active : Math.max(0, s.players.findIndex((p) => p.kind === 'human'));
  const kinds = new Set(s.players[humanIndex].hand.map(kindOf));
  const steps: TutorialStep[] = [
    { target: '.ss__castle', say: 'Im Schloss schlafen zwölf Tiere.' },
    kinds.has('wecker')
      ? { target: '.ss-action[aria-label="Wecker"]', say: 'Mit dem Wecker weckst du ein Tier auf. Dann gehört es dir.' }
      : { target: '.ss__castle', say: 'Mit einem Wecker weckst du ein Tier auf. Dann gehört es dir.' },
  ];
  if (kinds.has('dieb')) steps.push({ target: '.ss-action[aria-label="Waschbär"]', say: 'Der Waschbär holt dir ein Tier von den anderen.' });
  if (kinds.has('wachhund') || kinds.has('trommel'))
    steps.push({
      target: kinds.has('wachhund') ? '.ss-action[aria-label="Wachhund"]' : '.ss-action[aria-label="Trommel"]',
      say: 'Wachhund und Trommel beschützen deine Tiere.',
    });
  steps.push(
    { target: '.ss__template', say: 'Zahlenkarten wirst du los: eine einzelne, zwei gleiche oder eine Plus-Aufgabe, zum Beispiel zwei plus drei gleich fünf.' },
    { target: 'button[aria-label="Ausspielen"]', say: 'Tippe die Karten an und drücke dann den Haken.' },
    { target: '.ss__others', say: `Wer zuerst ${s.preset.winAnimals} Tiere wach hat, gewinnt!` },
  );
  return steps;
};
