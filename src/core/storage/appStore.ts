import { useSyncExternalStore } from 'react';
import type { PlayerProfile, ProfileSettings } from '../types/profile';
import { APP_DATA_KEY, createProfile, emptyAppData, migrateAppData, type AppData } from './appData';
import type { BackupFile } from './backup';
import { readJSON, writeJSON } from './kv';
import { clearProfileSessions, listAllSessionKeys, writeRaw } from './sessions';
import { removeKey } from './kv';

let data: AppData = emptyAppData();
let loaded = false;
const listeners = new Set<() => void>();

const ensureLoaded = () => {
  if (loaded) return;
  data = migrateAppData(readJSON<unknown>(APP_DATA_KEY));
  loaded = true;
};

const commit = (next: AppData) => {
  data = next;
  writeJSON(APP_DATA_KEY, data);
  listeners.forEach((l) => l());
};

export const appStore = {
  get(): AppData {
    ensureLoaded();
    return data;
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** Test hook. */
  reload() {
    loaded = false;
    ensureLoaded();
    listeners.forEach((l) => l());
  },
};

export const useAppData = () => useSyncExternalStore(appStore.subscribe, appStore.get, appStore.get);

export const useActiveProfile = (): PlayerProfile | null => {
  const app = useAppData();
  return app.profiles.find((p) => p.id === app.activeProfileId) ?? null;
};

export const getActiveProfile = (): PlayerProfile | null => {
  const app = appStore.get();
  return app.profiles.find((p) => p.id === app.activeProfileId) ?? null;
};

export const addProfile = (name: string, avatarId: string): PlayerProfile => {
  const profile = createProfile(name, avatarId);
  const app = appStore.get();
  commit({ ...app, profiles: [...app.profiles, profile], activeProfileId: profile.id });
  return profile;
};

export const setActiveProfile = (id: string) => {
  const app = appStore.get();
  if (app.profiles.some((p) => p.id === id)) commit({ ...app, activeProfileId: id });
};

export const updateProfile = (id: string, fn: (p: PlayerProfile) => PlayerProfile) => {
  const app = appStore.get();
  commit({ ...app, profiles: app.profiles.map((p) => (p.id === id ? fn(p) : p)) });
};

export const updateSettings = (id: string, patch: Partial<ProfileSettings>) =>
  updateProfile(id, (p) => ({ ...p, settings: { ...p.settings, ...patch } }));

export const deleteProfile = (id: string) => {
  const app = appStore.get();
  const profiles = app.profiles.filter((p) => p.id !== id);
  clearProfileSessions(id);
  commit({
    ...app,
    profiles,
    activeProfileId: app.activeProfileId === id ? (profiles[0]?.id ?? null) : app.activeProfileId,
  });
};

/** Replaces all profiles and saved games with the content of a backup file. */
export const restoreBackup = (backup: BackupFile) => {
  for (const key of listAllSessionKeys()) removeKey(key);
  for (const [key, value] of Object.entries(backup.sessions)) writeRaw(key, value);
  commit(migrateAppData(backup.app));
};
