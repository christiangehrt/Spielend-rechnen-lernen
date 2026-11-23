import { migrateAppData, type AppData } from './appData';
import type { VoiceExport } from '../audio/voiceStore';
import { listAllSessionKeys, readRaw } from './sessions';

export const BACKUP_FORMAT = 'spielend-rechnen-lernen-backup';
export const BACKUP_SCHEMA_VERSION = 1;

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  schemaVersion: number;
  exportedAt: string;
  app: AppData;
  sessions: Record<string, unknown>;
  /** Parents' own voice recordings (optional, base64). */
  voice?: VoiceExport[];
}

export const buildBackup = (app: AppData, now = new Date(), voice: VoiceExport[] = []): BackupFile => {
  const sessions: Record<string, unknown> = {};
  for (const key of listAllSessionKeys()) {
    const value = readRaw(key);
    if (value !== null) sessions[key] = value;
  }
  return {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    app,
    sessions,
    ...(voice.length ? { voice } : {}),
  };
};

export type ParseResult = { ok: true; backup: BackupFile } | { ok: false; reason: string };

export const parseBackup = (text: string): ParseResult => {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'Die Datei ist keine gültige JSON-Datei.' };
  }
  if (typeof raw !== 'object' || raw === null || (raw as BackupFile).format !== BACKUP_FORMAT) {
    return { ok: false, reason: 'Die Datei ist keine Sicherung dieser App.' };
  }
  const file = raw as Partial<BackupFile>;
  if (typeof file.schemaVersion !== 'number' || file.schemaVersion > BACKUP_SCHEMA_VERSION) {
    return { ok: false, reason: 'Die Sicherung stammt aus einer neueren App-Version.' };
  }
  const app = migrateAppData(file.app);
  if (app.profiles.length === 0) return { ok: false, reason: 'Die Sicherung enthält keine Profile.' };
  const sessions: Record<string, unknown> = {};
  if (typeof file.sessions === 'object' && file.sessions !== null) {
    for (const [key, value] of Object.entries(file.sessions)) {
      if (key.startsWith('activeSession_')) sessions[key] = value;
    }
  }
  const voice = Array.isArray(file.voice)
    ? file.voice.filter(
        (v): v is VoiceExport =>
          !!v && typeof v.key === 'string' && typeof v.mime === 'string' && typeof v.data === 'string' && /^[A-Za-z0-9+/=]*$/.test(v.data),
      )
    : [];
  return {
    ok: true,
    backup: {
      format: BACKUP_FORMAT,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: typeof file.exportedAt === 'string' ? file.exportedAt : '',
      app,
      sessions,
      ...(voice.length ? { voice } : {}),
    },
  };
};

export const backupFileName = (now = new Date()) =>
  `rechenspiele-sicherung-${now.toISOString().slice(0, 10)}.json`;
