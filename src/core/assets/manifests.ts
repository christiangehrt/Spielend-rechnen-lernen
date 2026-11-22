import { createContext, useContext } from 'react';
import type { SoundManifest } from '../audio/AudioManager';

export interface ArtEntry {
  src: string;
  emoji: string;
}
export interface StickerEntry {
  id: string;
  src: string;
  theme: string;
}
export interface ThemeEntry {
  id: string;
  name: string;
  src: string;
  art: string;
  color: string;
}

export interface Manifests {
  art: Record<string, ArtEntry>;
  stickers: StickerEntry[];
  themes: ThemeEntry[];
  sounds: SoundManifest;
}

export const BASE_URL = import.meta.env.BASE_URL ?? './';
export const assetUrl = (src: string) => BASE_URL + src;

const fetchJson = async <T>(path: string, fallback: T): Promise<T> => {
  try {
    const res = await fetch(assetUrl(path));
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
};

/** Loads every asset manifest. Missing manifests degrade to emoji fallbacks. */
export const loadManifests = async (): Promise<Manifests> => {
  const [art, stickers, themes, sounds] = await Promise.all([
    fetchJson<{ art: Record<string, ArtEntry> }>('assets/art.json', { art: {} }),
    fetchJson<{ stickers: StickerEntry[] }>('assets/stickers/stickers.json', { stickers: [] }),
    fetchJson<{ themes: ThemeEntry[] }>('assets/themes/themes.json', { themes: [] }),
    fetchJson<SoundManifest>('assets/sounds/sounds.json', { sprites: {}, clips: {} }),
  ]);
  return {
    art: art.art ?? {},
    stickers: stickers.stickers ?? [],
    themes: themes.themes ?? [],
    sounds: { sprites: sounds.sprites ?? {}, clips: sounds.clips ?? {} },
  };
};

export const emptyManifests: Manifests = { art: {}, stickers: [], themes: [], sounds: { sprites: {}, clips: {} } };

export const AssetsContext = createContext<Manifests>(emptyManifests);
export const useAssets = () => useContext(AssetsContext);
