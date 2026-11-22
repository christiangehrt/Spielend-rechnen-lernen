/**
 * Speech catalogue. Each key can be served by a recorded clip from
 * sounds.json ("clips"); otherwise the German text is spoken with the
 * browser's speech synthesis (if a German voice exists).
 */
export const PHRASES = {
  plus: 'plus',
  minus: 'minus',
  equals: 'ist gleich',
  ten_jump: 'Zehnersprung!',
  five_jump: 'Fünfersprung!',
  great: 'Super gemacht!',
  well_done: 'Gut gemacht!',
  try_again: 'Versuch es nochmal.',
  not_here: 'Das passt hier nicht.',
  too_far: 'Zu weit!',
  too_much: 'Das ist zu viel.',
  your_turn: 'Du bist dran.',
  yes: 'Ja!',
  no: 'Nein.',
  bigger: 'größer als',
  smaller: 'kleiner als',
  between: 'zwischen',
  and: 'und',
  exactly: 'genau',
  won: 'Gewonnen!',
  chest: 'Eine Schatztruhe!',
  new_sticker: 'Ein neuer Sticker!',
  continue: 'Weiterspielen',
  new_game: 'Neues Spiel',
  hold_parent: 'Für Eltern: drei Sekunden gedrückt halten.',
} as const;

export type PhraseKey = keyof typeof PHRASES;

/** A piece of an utterance: a phrase key, a number, or free text. */
export type SpeechPart = PhraseKey | number | { text: string };

export const clipKeyFor = (part: SpeechPart): string | null =>
  typeof part === 'number' ? `num_${part}` : typeof part === 'string' ? part : null;

export const textFor = (part: SpeechPart): string =>
  typeof part === 'number' ? String(part) : typeof part === 'string' ? PHRASES[part] : part.text;
