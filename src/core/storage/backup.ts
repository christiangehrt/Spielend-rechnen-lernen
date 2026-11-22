import { migrateAppData, type AppData } from './appData';
import { listAllSessionKeys, readRaw } from './sessions';

export const BACKUP_FORMAT = 'spielend-rechnen-lernen-backup';
export const BACKUP_SCHEMA_VERSION = 1;

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  schemaVersion: number;
  exportedAt: string;
  app: AppData;
  sessions: Record<string, unknown>;
}

export const buildBackup = (app: AppData, now = new Date()): BackupFile => {
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
  return {
    ok: true,
    backup: {
      format: BACKUP_FORMAT,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: typeof file.exportedAt === 'string' ? file.exportedAt : '',
      app,
      sessions,
    },
  };
};

export const backupFileName = (now = new Date()) =>
  `rechenspiele-sicherung-${now.toISOString().slice(0, 10)}.json`;
