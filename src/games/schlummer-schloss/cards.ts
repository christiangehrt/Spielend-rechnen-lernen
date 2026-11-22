import type { CardKind } from './types';

/** 40 number cards (1–10 ×4) plus 27 action cards = 67 cards. */
const LAYOUT: [CardKind, number][] = [
  ['number', 40],
  ['wecker', 8],
  ['dieb', 4],
  ['wachhund', 3],
  ['schlaflied', 4],
  ['trommel', 3],
  ['clown', 5],
];

const KINDS: CardKind[] = LAYOUT.flatMap(([kind, n]) => Array.from({ length: n }, () => kind));

export const DECK_SIZE = KINDS.length;
export const kindOf = (card: number): CardKind => KINDS[card];
export const valueOf = (card: number): number => (KINDS[card] === 'number' ? (card % 10) + 1 : 0);
export const isNumber = (card: number) => KINDS[card] === 'number';

export const CARD_ART: Record<CardKind, string> = {
  number: '',
  wecker: 'card.wecker',
  dieb: 'card.dieb',
  wachhund: 'card.wachhund',
  schlaflied: 'card.schlaflied',
  trommel: 'card.trommel',
  clown: 'card.clown',
};

export const CARD_NAME: Record<CardKind, string> = {
  number: 'Zahl',
  wecker: 'Wecker',
  dieb: 'Waschbär',
  wachhund: 'Wachhund',
  schlaflied: 'Schlaflied',
  trommel: 'Trommel',
  clown: 'Clown',
};

export interface Animal {
  id: number;
  art: string;
  name: string;
  points: number;
}

/** 12 sleeping animals: 4×5, 4×10, 3×15, 1×20 points. */
export const ANIMALS: Animal[] = [
  { id: 0, art: 'avatar.rabbit', name: 'Hase', points: 5 },
  { id: 1, art: 'avatar.frog', name: 'Frosch', points: 5 },
  { id: 2, art: 'avatar.penguin', name: 'Pinguin', points: 5 },
  { id: 3, art: 'avatar.octopus', name: 'Krake', points: 5 },
  { id: 4, art: 'avatar.cat', name: 'Katze', points: 10 },
  { id: 5, art: 'avatar.dog', name: 'Hund', points: 10 },
  { id: 6, art: 'avatar.fox', name: 'Fuchs', points: 10 },
  { id: 7, art: 'avatar.owl', name: 'Eule', points: 10 },
  { id: 8, art: 'avatar.panda', name: 'Panda', points: 15 },
  { id: 9, art: 'avatar.bear', name: 'Bär', points: 15 },
  { id: 10, art: 'avatar.tiger', name: 'Tiger', points: 15 },
  { id: 11, art: 'avatar.unicorn', name: 'Einhorn', points: 20 },
];
