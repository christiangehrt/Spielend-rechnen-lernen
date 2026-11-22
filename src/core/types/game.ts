import type { ComponentType } from 'react';
import type { NumberRange, ProfileSettings } from './profile';
import type { StrategyEventType } from './rewards';

export type LearningGoal = 'addition' | 'zerlegung' | 'zahlenstrahl' | 'vergleichen' | 'blitzblick';

export type PlayMode = 'solo' | 'coop' | 'bot' | 'versus';

export interface PresetOption {
  id: string;
  /** Short label shown under the icon, e.g. "1–20". */
  label: string;
  /** Art key from art.json shown on the preset button. */
  art: string;
  level: 'junior' | 'profi';
  /** Spoken description, e.g. "Zahlen bis zwanzig". */
  speech: string;
}

export interface ModeOption {
  id: PlayMode;
  players: number;
  art: string;
  speech: string;
}

export interface GameMeta {
  id: string;
  title: string;
  /** Art key for the hub tile. */
  art: string;
  /** CSS colour used for the tile and game accents. */
  color: string;
  learningGoals: LearningGoal[];
  /** Short spoken introduction (played from the lobby speaker button). */
  intro: string;
  /** Which roadmap phase delivers the module. */
  phase: 1 | 2 | 3 | 4;
}

export interface GameSetup {
  presetId: string;
  mode: PlayMode;
  seed: number;
  playerNames: string[];
  playerAvatars?: string[];
}

export interface GameResult {
  won: boolean;
  strategyEvents: StrategyEventType[];
  /** Optional score where lower is better (e.g. remaining cards, penalty points). */
  score?: number;
  /** Icon/value pairs shown on the result screen. */
  summary: { art: string; value: string; speech?: string }[];
}

export interface GameViewProps<S, A> {
  state: S;
  dispatch: (action: A) => void;
  settings: ProfileSettings;
}

export interface GameModule<S = any, A = any> {
  meta: GameMeta;
  presets: PresetOption[];
  modes: ModeOption[];
  /** Version of the persisted state shape; mismatching saved sessions are discarded. */
  stateVersion: number;
  defaultPresetId(range: NumberRange): string;
  create(setup: GameSetup): S;
  reduce(state: S, action: A): S;
  canUndo(state: S): boolean;
  undoAction: A;
  /** Non-null once the round is over. */
  result(state: S): GameResult | null;
  View: ComponentType<GameViewProps<S, A>>;
}
