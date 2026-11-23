import type { TutorialStep } from '../../core/types/game';
import { activePlayer, canPlayCard, getRequiredPlays } from './engine';
import type { TheGameState } from './types';

export const tutorial = (s: TheGameState): TutorialStep[] => {
  const delta = s.preset.reverseJumpDelta;
  const hand = activePlayer(s).hand;
  let move: { card: number; direction: 'asc' | 'desc' } | null = null;
  for (const card of hand) {
    const pile = s.piles.find((p) => canPlayCard(card, p, delta));
    if (pile) {
      move = { card, direction: pile.direction };
      break;
    }
  }
  const steps: TutorialStep[] = [
    { target: '.rr-pile--asc', say: 'Auf den grünen Stapel kommen größere Zahlen.' },
    { target: '.rr-pile--desc', say: 'Auf den orangen Stapel kommen kleinere Zahlen.' },
  ];
  if (move) {
    steps.push({
      target: `button[aria-label="Karte ${move.card}"]`,
      to: `.rr-pile--${move.direction}`,
      say: 'Zieh eine Karte auf einen Stapel. Oder tippe erst die Karte und dann den Stapel an.',
    });
  }
  steps.push(
    { target: '.rr__turn', say: getRequiredPlays(s) === 2 ? 'Lege mindestens zwei Karten. Dann drücke den Haken.' : 'Lege mindestens eine Karte. Dann drücke den Haken.' },
    { target: '.rr-pile--asc', say: `Trick: Genau ${delta} zurück darfst du immer springen!` },
  );
  return steps;
};
