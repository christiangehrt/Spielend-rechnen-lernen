import type { GameSetup } from '../types/game';
import { listKeys, readJSON, removeKey, writeJSON } from './kv';

export const SESSION_SCHEMA_VERSION = 1;

export interface SessionRecord<S = unknown> {
  schemaVersion: number;
  gameId: string;
  profileId: string;
  /** GameModule.stateVersion at save time; a mismatch invalidates the session. */
  stateVersion: number;
  setup: GameSetup;
  state: S;
  savedAt: number;
}

export const sessionKey = (profileId: string, gameId: string) => `activeSession_${profileId}_${gameId}`;

export const saveSession = <S>(record: Omit<SessionRecord<S>, 'schemaVersion' | 'savedAt'>): boolean =>
  writeJSON(sessionKey(record.profileId, record.gameId), {
    ...record,
    schemaVersion: SESSION_SCHEMA_VERSION,
    savedAt: Date.now(),
  } satisfies SessionRecord<S>);

const isValidRecord = (r: unknown): r is SessionRecord => {
  if (typeof r !== 'object' || r === null) return false;
  const rec = r as Partial<SessionRecord>;
  return (
    rec.schemaVersion === SESSION_SCHEMA_VERSION &&
    typeof rec.gameId === 'string' &&
    typeof rec.profileId === 'string' &&
    typeof rec.stateVersion === 'number' &&
    typeof rec.setup === 'object' &&
    rec.state !== undefined
  );
};

export const loadSession = <S>(profileId: string, gameId: string, stateVersion: number): SessionRecord<S> | null => {
  const rec = readJSON<SessionRecord<S>>(sessionKey(profileId, gameId));
  if (!isValidRecord(rec) || rec.stateVersion !== stateVersion) return null;
  return rec;
};

export const clearSession = (profileId: string, gameId: string) => removeKey(sessionKey(profileId, gameId));

/** All saved sessions of a profile, newest first. */
export const listSessions = (profileId: string): SessionRecord[] =>
  listKeys(`activeSession_${profileId}_`)
    .map((k) => readJSON<SessionRecord>(k))
    .filter(isValidRecord)
    .sort((a, b) => b.savedAt - a.savedAt);

export const clearProfileSessions = (profileId: string) => {
  for (const key of listKeys(`activeSession_${profileId}_`)) removeKey(key);
};

export const listAllSessionKeys = () => listKeys('activeSession_');
export const readRaw = (key: string) => readJSON<unknown>(key);
export const writeRaw = (key: string, value: unknown) => writeJSON(key, value);
