import type { PlacedSticker } from './rewards';

export const PROFILE_SCHEMA_VERSION = 1;

export type NumberRange = 10 | 20 | 100;

export interface ProfileSettings {
  defaultNumberRange: NumberRange; // Default: 20
  showDotPatterns: boolean; // Default: true
  showNumberLineHelper: boolean; // Default: true
  soundEnabled: boolean; // Default: true
  speechEnabled: boolean; // Default: true
}

export interface GameStats {
  played: number;
  won: number;
  starsEarned: number;
  lastPlayedAt: number | null;
  /** Lower is better where a game has a score (e.g. Klappen zu! penalty points). */
  bestScore: number | null;
}

export interface PlayerProfile {
  schemaVersion: number;
  id: string;
  name: string;
  avatarId: string;
  totalStars: number;
  starsTowardNextSticker: number; // 0–4; at 5 -> chest + reset to 0
  unlockedStickerIds: string[];
  placedStickers: PlacedSticker[];
  settings: ProfileSettings;
  gameStats: Record<string, GameStats>;
  /** Games whose show-how tutorial this child has already seen. */
  tutorialsSeen: string[];
  createdAt: number;
}

export const DEFAULT_SETTINGS: ProfileSettings = {
  defaultNumberRange: 20,
  showDotPatterns: true,
  showNumberLineHelper: true,
  soundEnabled: true,
  speechEnabled: true,
};

export const emptyGameStats = (): GameStats => ({
  played: 0,
  won: 0,
  starsEarned: 0,
  lastPlayedAt: null,
  bestScore: null,
});
