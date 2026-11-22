import { beforeEach, describe, expect, it } from 'vitest';
import { migrateAppData, normalizeProfile } from './appData';
import { addProfile, appStore, restoreBackup, updateProfile } from './appStore';
import { buildBackup, parseBackup } from './backup';
import { readJSON, resetStorageForTests, writeJSON } from './kv';
import { clearSession, listSessions, loadSession, saveSession } from './sessions';

const setup = { presetId: 'zr20', mode: 'solo' as const, seed: 1, playerNames: ['A'] };

beforeEach(() => {
  resetStorageForTests();
  appStore.reload();
});

describe('app data', () => {
  it('starts empty and persists new profiles', () => {
    expect(appStore.get().profiles).toEqual([]);
    const p = addProfile('Mia', 'avatar.fox');
    expect(appStore.get().activeProfileId).toBe(p.id);
    expect(readJSON<{ profiles: unknown[] }>('app')?.profiles).toHaveLength(1);
    expect(p.settings.defaultNumberRange).toBe(20);
    expect(p.settings.showDotPatterns).toBe(true);
  });

  it('migrates partial / old data with defaults', () => {
    const app = migrateAppData({ profiles: [{ id: 'x', name: 'Ben', settings: { soundEnabled: false } }] });
    expect(app.activeProfileId).toBe('x');
    expect(app.profiles[0].settings).toMatchObject({ soundEnabled: false, speechEnabled: true, defaultNumberRange: 20 });
    expect(app.profiles[0].starsTowardNextSticker).toBe(0);
  });

  it('rejects garbage profiles', () => {
    expect(normalizeProfile(null)).toBeNull();
    expect(normalizeProfile({ name: 'no id' })).toBeNull();
    expect(migrateAppData('nonsense').profiles).toEqual([]);
  });
});

describe('sessions (auto-resume)', () => {
  it('saves and restores the exact state', () => {
    const state = { deck: [3, 4, 5], hand: [7, 8] };
    saveSession({ gameId: 'g', profileId: 'p', stateVersion: 1, setup, state });
    expect(loadSession('p', 'g', 1)?.state).toEqual(state);
    expect(listSessions('p')).toHaveLength(1);
    clearSession('p', 'g');
    expect(loadSession('p', 'g', 1)).toBeNull();
  });

  it('discards sessions from an older state version', () => {
    saveSession({ gameId: 'g', profileId: 'p', stateVersion: 1, setup, state: {} });
    expect(loadSession('p', 'g', 2)).toBeNull();
  });

  it('ignores corrupt session records', () => {
    writeJSON('activeSession_p_g', { foo: 1 });
    expect(loadSession('p', 'g', 1)).toBeNull();
    expect(listSessions('p')).toEqual([]);
  });
});

describe('JSON backup', () => {
  it('round-trips profiles, sticker album and sessions losslessly', () => {
    const p = addProfile('Mia', 'avatar.cat');
    updateProfile(p.id, (prof) => ({
      ...prof,
      totalStars: 17,
      starsTowardNextSticker: 2,
      unlockedStickerIds: ['s1', 's2'],
      placedStickers: [{ instanceId: 'i1', stickerId: 's1', sceneId: 'jungle', xPercent: 20, yPercent: 30, scale: 1.4 }],
    }));
    saveSession({ gameId: 'g', profileId: p.id, stateVersion: 1, setup, state: { a: 1 } });
    const before = appStore.get();
    const text = JSON.stringify(buildBackup(before));

    resetStorageForTests();
    appStore.reload();
    expect(appStore.get().profiles).toHaveLength(0);

    const parsed = parseBackup(text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    restoreBackup(parsed.backup);
    expect(appStore.get()).toEqual(before);
    expect(loadSession(p.id, 'g', 1)?.state).toEqual({ a: 1 });
  });

  it('rejects foreign or broken files', () => {
    expect(parseBackup('{').ok).toBe(false);
    expect(parseBackup('{"format":"other"}').ok).toBe(false);
    expect(parseBackup(JSON.stringify({ format: 'spielend-rechnen-lernen-backup', schemaVersion: 99 })).ok).toBe(false);
    expect(parseBackup(JSON.stringify({ format: 'spielend-rechnen-lernen-backup', schemaVersion: 1, app: {} })).ok).toBe(false);
  });
});
