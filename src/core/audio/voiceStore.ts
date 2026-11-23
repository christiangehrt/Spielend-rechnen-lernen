/**
 * Parents' own voice recordings, stored per device in IndexedDB
 * (localStorage is far too small for audio). Every call degrades gracefully:
 * without IndexedDB the feature is simply unavailable.
 */
export interface VoiceClip {
  key: string;
  blob: Blob;
  mime: string;
  createdAt: number;
}

const DB_NAME = 'msl-voice';
const STORE = 'clips';

let dbPromise: Promise<IDBDatabase> | null = null;

export const voiceStoreAvailable = () => {
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
};

const openDb = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: 'key' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (e) {
      reject(e);
    }
  });
  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
};

const tx = async <T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = run(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

export const getAllVoiceClips = async (): Promise<VoiceClip[]> => {
  if (!voiceStoreAvailable()) return [];
  try {
    return await tx<VoiceClip[]>('readonly', (s) => s.getAll() as IDBRequest<VoiceClip[]>);
  } catch {
    return [];
  }
};

export const putVoiceClip = async (key: string, blob: Blob) =>
  tx('readwrite', (s) => s.put({ key, blob, mime: blob.type, createdAt: Date.now() } satisfies VoiceClip));

export const deleteVoiceClip = async (key: string) => tx('readwrite', (s) => s.delete(key));

export const clearVoiceClips = async () => tx('readwrite', (s) => s.clear());

// ---------- backup helpers ----------

export interface VoiceExport {
  key: string;
  mime: string;
  /** base64 encoded audio data */
  data: string;
}

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

export const exportVoiceClips = async (): Promise<VoiceExport[]> => {
  const clips = await getAllVoiceClips();
  return Promise.all(clips.map(async (c) => ({ key: c.key, mime: c.mime, data: await blobToBase64(c.blob) })));
};

export const importVoiceClips = async (clips: VoiceExport[]) => {
  await clearVoiceClips();
  for (const c of clips) {
    const bytes = Uint8Array.from(atob(c.data), (ch) => ch.charCodeAt(0));
    await putVoiceClip(c.key, new Blob([bytes], { type: c.mime }));
  }
};
