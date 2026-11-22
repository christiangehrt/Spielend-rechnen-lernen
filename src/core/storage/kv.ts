/**
 * Defensive localStorage wrapper. Every access is wrapped in try/catch because
 * storage can be unavailable (private mode, blocked site data, quota). In that
 * case an in-memory map keeps the app working for the current visit.
 */
export const KEY_PREFIX = 'msl.';

interface KeyValue {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  keys(): string[];
}

const memory = new Map<string, string>();
const memoryBackend: KeyValue = {
  getItem: (k) => memory.get(k) ?? null,
  setItem: (k, v) => void memory.set(k, v),
  removeItem: (k) => void memory.delete(k),
  keys: () => [...memory.keys()],
};

const detectBackend = (): KeyValue => {
  try {
    const ls = globalThis.localStorage;
    if (!ls) return memoryBackend;
    const probe = `${KEY_PREFIX}__probe`;
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return {
      getItem: (k) => ls.getItem(k),
      setItem: (k, v) => ls.setItem(k, v),
      removeItem: (k) => ls.removeItem(k),
      keys: () => Array.from({ length: ls.length }, (_, i) => ls.key(i)).filter((k): k is string => !!k),
    };
  } catch {
    return memoryBackend;
  }
};

let backend: KeyValue | null = null;
const getBackend = () => (backend ??= detectBackend());

/** Test hook: force the in-memory backend and clear it. */
export const resetStorageForTests = () => {
  memory.clear();
  backend = memoryBackend;
};

export const isPersistent = () => getBackend() !== memoryBackend;

export const readJSON = <T>(key: string): T | null => {
  try {
    const raw = getBackend().getItem(KEY_PREFIX + key);
    return raw == null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
};

export const writeJSON = (key: string, value: unknown): boolean => {
  try {
    getBackend().setItem(KEY_PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

export const removeKey = (key: string) => {
  try {
    getBackend().removeItem(KEY_PREFIX + key);
  } catch {
    /* ignore */
  }
};

/** Keys (without prefix) that start with the given sub-prefix. */
export const listKeys = (subPrefix = ''): string[] => {
  try {
    return getBackend()
      .keys()
      .filter((k) => k.startsWith(KEY_PREFIX + subPrefix))
      .map((k) => k.slice(KEY_PREFIX.length));
  } catch {
    return [];
  }
};
