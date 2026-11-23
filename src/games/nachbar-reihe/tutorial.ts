import type { TutorialStep } from '../../core/types/game';
import { canPlay, colorOf, valueOf } from './engine';
import type { NrState } from './types';

const COLOR_NAMES = ['rot', 'blau', 'grün', 'gelb'];

export const tutorial = (s: NrState): TutorialStep[] => {
  const me = s.players[s.active].kind === 'human' ? s.players[s.active] : (s.players.find((p) => p.kind === 'human') ?? s.players[0]);
  const playable = me.hand.find((c) => canPlay(s, c));
  return [
    { target: '.nr-slot--eleven', say: 'Jede Farbe beginnt mit der Elf.' },
    playable !== undefined
      ? {
          target: `button[aria-label="${COLOR_NAMES[colorOf(playable)]} ${valueOf(playable)}"]`,
          say: 'Tippe eine passende Karte an und tippe sie nochmal. Dann wird sie gelegt.',
        }
      : { target: '.nr__cards', say: 'Das sind deine Karten.' },
    { target: '.nr-row', say: 'Danach passen nur Nachbarzahlen: eins weniger links, eins mehr rechts.' },
    { target: '.nr__deck', say: 'Passt keine Karte? Dann ziehe hier eine Karte.' },
    { target: 'button[aria-label="Zug beenden"]', say: 'Zum Schluss drückst du den Haken.' },
    { target: '.nr__players', say: 'Wer zuerst keine Karten mehr hat, gewinnt.' },
  ];
};
