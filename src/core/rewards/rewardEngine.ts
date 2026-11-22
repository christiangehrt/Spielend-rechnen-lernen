import type { GameResult } from '../types/game';
import { emptyGameStats, type PlayerProfile } from '../types/profile';
import type { RewardEventType, StarAward } from '../types/rewards';
import { nextRandom } from '../random/rng';

export const STARS_PER_CHEST = 5;

export const STAR_VALUES: Record<'GAME_COMPLETED' | 'GAME_WON' | 'STRATEGY', number> = {
  GAME_COMPLETED: 1,
  GAME_WON: 2,
  STRATEGY: 1,
};

/**
 * Round finished +1, round won +2, at least one strategy move +1 bonus star.
 * Stars are granted only when a round ends, so undoing and replaying a clever
 * move can never be farmed.
 */
export const computeStarAward = (result: GameResult): StarAward => {
  const events: RewardEventType[] = ['GAME_COMPLETED'];
  let total = STAR_VALUES.GAME_COMPLETED;
  if (result.won) {
    events.push('GAME_WON');
    total += STAR_VALUES.GAME_WON;
  }
  const strategy = [...new Set(result.strategyEvents)];
  if (strategy.length > 0) {
    events.push(...strategy);
    total += STAR_VALUES.STRATEGY;
  }
  return { total, events };
};

export interface AwardOutcome {
  profile: PlayerProfile;
  /** One entry per chest opened; null when every sticker was already unlocked. */
  chests: (string | null)[];
}

/** Adds stars, opens a chest every 5 stars and unlocks a sticker without duplicates. */
export const applyStars = (
  profile: PlayerProfile,
  stars: number,
  allStickerIds: readonly string[],
  seed: number = (Math.random() * 2 ** 32) >>> 0,
): AwardOutcome => {
  let toward = profile.starsTowardNextSticker;
  const unlocked = [...profile.unlockedStickerIds];
  const chests: (string | null)[] = [];
  let s = seed;
  for (let i = 0; i < stars; i++) {
    toward += 1;
    if (toward >= STARS_PER_CHEST) {
      toward = 0;
      const candidates = allStickerIds.filter((id) => !unlocked.includes(id));
      if (candidates.length === 0) {
        chests.push(null);
      } else {
        const [r, ns] = nextRandom(s);
        s = ns;
        const pick = candidates[Math.floor(r * candidates.length)];
        unlocked.push(pick);
        chests.push(pick);
      }
    }
  }
  return {
    profile: {
      ...profile,
      totalStars: profile.totalStars + stars,
      starsTowardNextSticker: toward,
      unlockedStickerIds: unlocked,
    },
    chests,
  };
};

export const recordGameStats = (
  profile: PlayerProfile,
  gameId: string,
  result: GameResult,
  stars: number,
  now = Date.now(),
): PlayerProfile => {
  const prev = profile.gameStats[gameId] ?? emptyGameStats();
  const best =
    result.score === undefined
      ? prev.bestScore
      : prev.bestScore === null
        ? result.score
        : Math.min(prev.bestScore, result.score);
  return {
    ...profile,
    gameStats: {
      ...profile.gameStats,
      [gameId]: {
        played: prev.played + 1,
        won: prev.won + (result.won ? 1 : 0),
        starsEarned: prev.starsEarned + stars,
        lastPlayedAt: now,
        bestScore: best,
      },
    },
  };
};

/** True when the result beats an existing best score (not on the very first round). */
export const isNewRecord = (profile: PlayerProfile, gameId: string, result: GameResult): boolean => {
  const prev = profile.gameStats[gameId]?.bestScore;
  return result.score !== undefined && prev !== null && prev !== undefined && result.score < prev;
};
