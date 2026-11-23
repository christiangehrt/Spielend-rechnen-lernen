import {
  DEFAULT_SETTINGS,
  PROFILE_SCHEMA_VERSION,
  emptyGameStats,
  type GameStats,
  type PlayerProfile,
  type ProfileSettings,
  type RecentRound,
  type SkillStat,
} from '../types/profile';
import type { PlacedSticker } from '../types/rewards';

export const APP_SCHEMA_VERSION = 1;
export const APP_DATA_KEY = 'app';

export interface AppData {
  schemaVersion: number;
  profiles: PlayerProfile[];
  activeProfileId: string | null;
}

export const emptyAppData = (): AppData => ({
  schemaVersion: APP_SCHEMA_VERSION,
  profiles: [],
  activeProfileId: null,
});

export const newId = (): string => {
  try {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export const createProfile = (name: string, avatarId: string): PlayerProfile => ({
  schemaVersion: PROFILE_SCHEMA_VERSION,
  id: newId(),
  name,
  avatarId,
  totalStars: 0,
  starsTowardNextSticker: 0,
  unlockedStickerIds: [],
  placedStickers: [],
  settings: { ...DEFAULT_SETTINGS },
  gameStats: {},
  tutorialsSeen: [],
  skillStats: {},
  createdAt: Date.now(),
});

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
const str = (v: unknown, fallback: string) => (typeof v === 'string' ? v : fallback);

const normalizeSettings = (raw: unknown): ProfileSettings => {
  const s = isObj(raw) ? raw : {};
  const range = s.defaultNumberRange;
  return {
    defaultNumberRange: range === 10 || range === 20 || range === 100 ? range : DEFAULT_SETTINGS.defaultNumberRange,
    showDotPatterns: bool(s.showDotPatterns, DEFAULT_SETTINGS.showDotPatterns),
    showNumberLineHelper: bool(s.showNumberLineHelper, DEFAULT_SETTINGS.showNumberLineHelper),
    soundEnabled: bool(s.soundEnabled, DEFAULT_SETTINGS.soundEnabled),
    speechEnabled: bool(s.speechEnabled, DEFAULT_SETTINGS.speechEnabled),
    adaptiveDifficulty: bool(s.adaptiveDifficulty, DEFAULT_SETTINGS.adaptiveDifficulty),
  };
};

const normalizeSticker = (raw: unknown): PlacedSticker | null => {
  if (!isObj(raw) || typeof raw.stickerId !== 'string' || typeof raw.sceneId !== 'string') return null;
  return {
    instanceId: str(raw.instanceId, newId()),
    stickerId: raw.stickerId,
    sceneId: raw.sceneId,
    xPercent: Math.min(100, Math.max(0, num(raw.xPercent, 50))),
    yPercent: Math.min(100, Math.max(0, num(raw.yPercent, 50))),
    scale: Math.min(3, Math.max(0.4, num(raw.scale, 1))),
  };
};

const normalizeStats = (raw: unknown): Record<string, GameStats> => {
  if (!isObj(raw)) return {};
  const out: Record<string, GameStats> = {};
  for (const [gameId, value] of Object.entries(raw)) {
    const v = isObj(value) ? value : {};
    const base = emptyGameStats();
    out[gameId] = {
      played: num(v.played, base.played),
      won: num(v.won, base.won),
      starsEarned: num(v.starsEarned, base.starsEarned),
      lastPlayedAt: typeof v.lastPlayedAt === 'number' ? v.lastPlayedAt : null,
      bestScore: typeof v.bestScore === 'number' ? v.bestScore : null,
      recent: (Array.isArray(v.recent) ? v.recent : [])
        .filter((r): r is Record<string, unknown> => isObj(r) && typeof r.preset === 'string')
        .map(
          (r): RecentRound => ({
            preset: r.preset as string,
            ...(r.bot === 'anfaenger' || r.bot === 'mittel' || r.bot === 'clever' ? { bot: r.bot } : {}),
            mastered: r.mastered === true,
            at: num(r.at, 0),
          }),
        )
        .slice(-8),
    };
  }
  return out;
};

const normalizeSkills = (raw: unknown): Record<string, SkillStat> => {
  if (!isObj(raw)) return {};
  const out: Record<string, SkillStat> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (isObj(value)) out[key] = { ok: Math.max(0, num(value.ok, 0)), miss: Math.max(0, num(value.miss, 0)) };
  }
  return out;
};

/** Brings any stored/imported profile up to the current schema (fills missing fields). */
export const normalizeProfile = (raw: unknown): PlayerProfile | null => {
  if (!isObj(raw) || typeof raw.id !== 'string') return null;
  const stickers = Array.isArray(raw.placedStickers) ? raw.placedStickers : [];
  const unlocked = Array.isArray(raw.unlockedStickerIds)
    ? raw.unlockedStickerIds.filter((x): x is string => typeof x === 'string')
    : [];
  return {
    schemaVersion: PROFILE_SCHEMA_VERSION,
    id: raw.id,
    name: str(raw.name, ''),
    avatarId: str(raw.avatarId, 'avatar.fox'),
    totalStars: Math.max(0, num(raw.totalStars, 0)),
    starsTowardNextSticker: Math.min(4, Math.max(0, Math.floor(num(raw.starsTowardNextSticker, 0)))),
    unlockedStickerIds: [...new Set(unlocked)],
    placedStickers: stickers.map(normalizeSticker).filter((s): s is PlacedSticker => s !== null),
    settings: normalizeSettings(raw.settings),
    gameStats: normalizeStats(raw.gameStats),
    skillStats: normalizeSkills(raw.skillStats),
    tutorialsSeen: Array.isArray(raw.tutorialsSeen)
      ? [...new Set(raw.tutorialsSeen.filter((x): x is string => typeof x === 'string'))]
      : [],
    createdAt: num(raw.createdAt, Date.now()),
  };
};

/**
 * Migrates stored app data to APP_SCHEMA_VERSION. Unknown future versions are
 * read best-effort (normalisation keeps known fields) instead of being wiped.
 */
export const migrateAppData = (raw: unknown): AppData => {
  if (!isObj(raw)) return emptyAppData();
  const profiles = (Array.isArray(raw.profiles) ? raw.profiles : [])
    .map(normalizeProfile)
    .filter((p): p is PlayerProfile => p !== null);
  const active = typeof raw.activeProfileId === 'string' ? raw.activeProfileId : null;
  return {
    schemaVersion: APP_SCHEMA_VERSION,
    profiles,
    activeProfileId: profiles.some((p) => p.id === active) ? active : (profiles[0]?.id ?? null),
  };
};
