import type { SpeechPart } from './audio/phrases';

/**
 * Explanatory feedback for mistakes. Instead of only "wrong", the child hears
 * why – built from recordable speech parts (numbers + phrases).
 */

const join = (values: number[], word: 'and' | 'plus'): SpeechPart[] =>
  values.flatMap((v, i) => (i === 0 ? [v] : [word, v] as SpeechPart[]));

/** Rauf & Runter: "6 ist kleiner als 9. Hier kommen nur größere Zahlen hin." */
export const explainPileMismatch = (card: number, top: number, direction: 'asc' | 'desc'): SpeechPart[] => {
  if (card === top) return ['same_number'];
  return direction === 'asc' ? [card, 'is', 'smaller', top, 'only_bigger_here'] : [card, 'is', 'bigger', top, 'only_smaller_here'];
};

/** Klappen zu!: "Das sind 10. Du brauchst nur 8." */
export const explainOvershoot = (sum: number, goal: number): SpeechPart[] => ['that_makes', sum, 'you_need_only', goal];

/** Verliebte Zahlen: "6 und 7 sind 13. Das ist mehr als zehn." */
export const explainOverTen = (values: number[]): SpeechPart[] => [
  ...join(values, 'and'),
  'are',
  values.reduce((a, b) => a + b, 0),
  'more_than_ten',
];

/** Zahlenstrahl-Hüpfen: "Zu weit! Du darfst nur noch 3 weit hüpfen." */
export const explainTooFar = (rest: number): SpeechPart[] => ['too_far', 'only_left', rest, 'jump_far'];

/** Nachbar-Reihe: "8 passt hier nicht. Hier passen nur 9 und 14." */
export const explainNeighbour = (value: number, row: { min: number; max: number } | null, maxNum: number): SpeechPart[] => {
  if (!row) return ['starts_eleven'];
  const options = [row.min - 1, row.max + 1].filter((v) => v >= 1 && v <= maxNum);
  return options.length ? [value, 'does_not_fit', 'only_fit', ...join(options, 'and')] : [value, 'does_not_fit'];
};

/** Schlummer-Schloss: "2 plus 3 sind 5, nicht 6." / "3 und 4 sind nicht gleich." */
export const explainEquation = (values: number[]): SpeechPart[] => {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 2) return [sorted[0], 'and', sorted[1], 'not_equal'];
  const rest = sorted.slice(0, -1);
  return [...join(rest, 'plus'), 'are', rest.reduce((a, b) => a + b, 0), 'not', sorted[sorted.length - 1]];
};

/** Quantity in the structure of five and ten: "5 und 2 sind 7", "10 und 3 sind 13". */
export const explainQuantity = (n: number): SpeechPart[] => {
  if (n <= 5) return [n];
  if (n <= 10) return [5, 'and', n - 5, 'are', n];
  return [10, 'and', n - 10, 'are', n];
};
