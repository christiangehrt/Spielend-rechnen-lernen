/**
 * Speech catalogue. Each key can be served (in this order) by
 *  1. a parent's own recording (Elternbereich → Eigene Stimme),
 *  2. a delivered clip from sounds.json ("clips"),
 *  3. the browser's speech synthesis (if a German voice exists).
 */
export const PHRASES = {
  // arithmetic
  plus: 'plus',
  minus: 'minus',
  equals: 'ist gleich',
  ten_jump: 'Zehnersprung!',
  five_jump: 'Fünfersprung!',
  is: 'ist',
  are: 'sind',
  not: 'nicht',
  look: 'Schau mal:',
  // praise
  great: 'Super gemacht!',
  well_done: 'Gut gemacht!',
  won: 'Gewonnen!',
  new_sticker: 'Ein neuer Sticker!',
  chest: 'Eine Schatztruhe!',
  all_shut: 'Alle Klappen zu! Super!',
  found_it: 'Du hast meine Zahl gefunden!',
  // hints
  try_again: 'Versuch es nochmal.',
  not_here: 'Das passt hier nicht.',
  too_far: 'Zu weit!',
  too_much: 'Das ist zu viel.',
  missing: 'Es fehlen noch',
  one_more_card: 'Lege noch eine Karte.',
  two_more_cards: 'Lege noch zwei Karten.',
  no_more_moves: 'Das geht leider nicht mehr.',
  points: 'Punkte',
  flip_more: 'Drehe noch ein Kärtchen um.',
  magpie_steals: 'Oh nein! Die Elster klaut deine Karten.',
  magpie_flies: 'Die Elster fliegt weg.',
  bigger_jump: 'Mach einen größeren Sprung!',
  frog_right: 'Der Frosch hüpft nach rechts.',
  frog_left: 'Der Frosch hüpft nach links.',
  your_turn: 'Du bist dran.',
  // explaining mistakes
  that_makes: 'Das sind',
  you_need_only: 'Du brauchst nur',
  more_than_ten: 'Das ist mehr als zehn.',
  only_bigger_here: 'Hier kommen nur größere Zahlen hin.',
  only_smaller_here: 'Hier kommen nur kleinere Zahlen hin.',
  same_number: 'Die gleiche Zahl passt nicht.',
  only_left: 'Du darfst nur noch',
  jump_far: 'weit hüpfen.',
  does_not_fit: 'passt hier nicht.',
  only_fit: 'Hier passen nur',
  starts_eleven: 'Diese Farbe beginnt mit der Elf.',
  not_equal: 'sind nicht gleich.',
  look_close: 'Schau mal genau. Siehst du fünf gleiche Früchte?',
  // growing difficulty
  level_up: 'Du bist schon richtig gut! Probier mal die nächste Stufe.',
  level_down: 'Wir üben noch ein bisschen mit der leichteren Stufe.',
  // mascot
  mascot_hello: 'Hallo! Ich bin Pünktchen.',
  mascot_play: 'Was wollen wir heute spielen?',
  mascot_great: 'Toll, du wirst immer besser!',
  mascot_tip: 'Tippe auf ein Spiel. Ich zeige dir, wie es geht.',
  // detective
  think_number: 'Ich denke mir eine Zahl bis',
  bigger: 'größer als',
  smaller: 'kleiner als',
  between: 'zwischen',
  and: 'und',
  is_it: 'Ist es die',
  exactly: 'genau',
  yes: 'Ja!',
  no: 'Nein.',
  knew_that: 'Das wussten wir schon.',
  choose_question: 'Wähle zuerst eine Frage.',
  tap_number: 'Tippe auf eine Zahl.',
  // navigation
  continue: 'Weiterspielen',
  new_game: 'Neues Spiel',
  hold_parent: 'Für Eltern: drei Sekunden gedrückt halten.',
} as const;

export type PhraseKey = keyof typeof PHRASES;

/**
 * A piece of an utterance: a phrase key, a number, or free text. Free text may
 * carry a `key` (e.g. `title_klappen-zu`) so a recording can replace it.
 */
export type SpeechPart = PhraseKey | number | { text: string; key?: string };

export const clipKeyFor = (part: SpeechPart): string | null =>
  typeof part === 'number' ? `num_${part}` : typeof part === 'string' ? part : (part.key ?? null);

export const textFor = (part: SpeechPart): string =>
  typeof part === 'number' ? String(part) : typeof part === 'string' ? PHRASES[part] : part.text;
