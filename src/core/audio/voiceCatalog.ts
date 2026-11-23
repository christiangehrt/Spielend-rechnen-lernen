import type { GameMeta } from '../types/game';
import { PHRASES, type PhraseKey } from './phrases';

export interface VoiceItem {
  key: string;
  /** What the parent should say. */
  text: string;
  /** Longer recordings (game explanations) get more time. */
  long?: boolean;
}

export interface VoiceGroup {
  id: string;
  title: string;
  hint?: string;
  optional?: boolean;
  items: VoiceItem[];
}

const phrase = (key: PhraseKey): VoiceItem => ({ key, text: PHRASES[key] });
const numbers = (from: number, to: number): VoiceItem[] =>
  Array.from({ length: to - from + 1 }, (_, i) => ({ key: `num_${from + i}`, text: String(from + i) }));

/** Everything the app can play in a parent's own voice, most important first. */
export const buildVoiceCatalog = (games: GameMeta[]): VoiceGroup[] => [
  { id: 'numbers', title: 'Zahlen 0–20', hint: 'Werden am häufigsten gesprochen.', items: numbers(0, 20) },
  {
    id: 'math',
    title: 'Rechnen',
    items: (['plus', 'minus', 'equals', 'is', 'are', 'not', 'ten_jump', 'five_jump', 'look'] as PhraseKey[]).map(phrase),
  },
  {
    id: 'praise',
    title: 'Loben',
    items: (['great', 'well_done', 'won', 'new_sticker', 'all_shut', 'found_it'] as PhraseKey[]).map(phrase),
  },
  {
    id: 'titles',
    title: 'Spielnamen',
    items: games.map((g) => ({ key: `title_${g.id}`, text: g.title })),
  },
  {
    id: 'hints',
    title: 'Hinweise',
    items: (
      [
        'not_here',
        'too_far',
        'too_much',
        'missing',
        'one_more_card',
        'two_more_cards',
        'no_more_moves',
        'points',
        'flip_more',
        'magpie_steals',
        'magpie_flies',
        'bigger_jump',
        'frog_right',
        'frog_left',
        'try_again',
        'that_makes',
        'you_need_only',
        'more_than_ten',
        'only_bigger_here',
        'only_smaller_here',
        'same_number',
        'only_left',
        'jump_far',
        'does_not_fit',
        'only_fit',
        'starts_eleven',
        'not_equal',
        'look_close',
      ] as PhraseKey[]
    ).map(phrase),
  },
  {
    id: 'mascot',
    title: 'Pünktchen & Stufen',
    items: (['mascot_hello', 'mascot_play', 'mascot_great', 'mascot_tip', 'level_up', 'level_down'] as PhraseKey[]).map(phrase),
  },
  {
    id: 'detective',
    title: 'Zahlen-Detektiv',
    items: (
      ['think_number', 'bigger', 'smaller', 'between', 'and', 'is_it', 'yes', 'no', 'knew_that', 'choose_question', 'tap_number'] as PhraseKey[]
    ).map(phrase),
  },
  {
    id: 'intros',
    title: 'Spielerklärungen',
    hint: 'Erklären Sie das Spiel in Ihren eigenen Worten (bis 40 Sekunden). Vorschlag:',
    optional: true,
    items: games.map((g) => ({ key: `intro_${g.id}`, text: g.intro, long: true })),
  },
  { id: 'numbers100', title: 'Zahlen 21–100 (Profi)', optional: true, items: numbers(21, 100) },
];
