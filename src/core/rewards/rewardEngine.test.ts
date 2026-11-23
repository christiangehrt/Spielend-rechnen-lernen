import { describe, expect, it } from 'vitest';
import { createProfile } from '../storage/appData';
import { applyStars, computeStarAward, isNewRecord, recordGameStats } from './rewardEngine';

const base = { summary: [] };

describe('computeStarAward', () => {
  it('gives 1 star for a finished round', () => {
    expect(computeStarAward({ ...base, won: false, strategyEvents: [] })).toEqual({ total: 1, events: ['GAME_COMPLETED'] });
  });
  it('adds 2 stars for a win and 1 bonus star for strategy (once)', () => {
    const award = computeStarAward({
      ...base,
      won: true,
      strategyEvents: ['STRATEGY_REVERSE_JUMP', 'STRATEGY_REVERSE_JUMP', 'STRATEGY_TEN_BRIDGE'],
    });
    expect(award.total).toBe(4);
    expect(award.events).toEqual(['GAME_COMPLETED', 'GAME_WON', 'STRATEGY_REVERSE_JUMP', 'STRATEGY_TEN_BRIDGE']);
  });
});

describe('applyStars', () => {
  const stickers = ['a', 'b', 'c'];
  it('opens a chest at 5 stars and resets the counter', () => {
    const p = { ...createProfile('x', 'avatar.fox'), starsTowardNextSticker: 3 };
    const out = applyStars(p, 4, stickers, 1);
    expect(out.chests).toHaveLength(1);
    expect(out.profile.starsTowardNextSticker).toBe(2);
    expect(out.profile.totalStars).toBe(4);
    expect(out.profile.unlockedStickerIds).toEqual([out.chests[0]]);
  });

  it('never unlocks duplicates and handles a full album', () => {
    let p = createProfile('x', 'avatar.fox');
    const seen: (string | null)[] = [];
    for (let i = 0; i < 5; i++) {
      const out = applyStars(p, 5, stickers, i + 10);
      p = out.profile;
      seen.push(...out.chests);
    }
    expect(seen.slice(0, 3).sort()).toEqual(['a', 'b', 'c']);
    expect(seen.slice(3)).toEqual([null, null]);
    expect(new Set(p.unlockedStickerIds).size).toBe(3);
  });
});

describe('game stats', () => {
  it('tracks played/won/best score', () => {
    let p = createProfile('x', 'avatar.fox');
    p = recordGameStats(p, 'g', { ...base, won: false, strategyEvents: [], score: 12 }, 1, 100);
    expect(isNewRecord(p, 'g', { ...base, won: false, strategyEvents: [], score: 8 })).toBe(true);
    p = recordGameStats(p, 'g', { ...base, won: true, strategyEvents: [], score: 8 }, 3, 200);
    expect(p.gameStats.g).toEqual({ played: 2, won: 1, starsEarned: 4, lastPlayedAt: 200, bestScore: 8, recent: [] });
  });

  it('remembers recent rounds per level and aggregates learning insights', () => {
    let p = createProfile('x', 'avatar.fox');
    p = recordGameStats(p, 'g', { ...base, won: false, mastered: true, strategyEvents: [], insights: [{ key: 'blitzblick:7', ok: false }] }, 1, 5, { preset: 'bis10' });
    p = recordGameStats(p, 'g', { ...base, won: true, strategyEvents: [], insights: [{ key: 'blitzblick:7', ok: true }, { key: 'blitzblick:7', ok: false }] }, 3, 6, { preset: 'bis10', bot: 'mittel' });
    expect(p.gameStats.g.recent).toEqual([
      { preset: 'bis10', mastered: true, at: 5 },
      { preset: 'bis10', bot: 'mittel', mastered: true, at: 6 },
    ]);
    expect(p.skillStats['blitzblick:7']).toEqual({ ok: 1, miss: 2 });
    for (let i = 0; i < 10; i++) p = recordGameStats(p, 'g', { ...base, won: false, strategyEvents: [] }, 1, 10 + i, { preset: 'bis10' });
    expect(p.gameStats.g.recent).toHaveLength(8);
  });
});
