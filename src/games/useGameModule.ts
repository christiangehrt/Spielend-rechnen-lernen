import { useEffect, useState } from 'react';
import type { GameModule } from '../core/types/game';
import { getLoadedModule, loadModule } from './registry';

/** Loads a game module lazily (code-split chunk, precached by the service worker). */
export function useGameModule(gameId: string): GameModule | null | undefined {
  const [mod, setMod] = useState<GameModule | null | undefined>(() => getLoadedModule(gameId) ?? undefined);
  useEffect(() => {
    let alive = true;
    if (mod?.meta.id === gameId) return;
    loadModule(gameId)
      .then((m) => alive && setMod(m))
      .catch(() => alive && setMod(null));
    return () => {
      alive = false;
    };
  }, [gameId, mod]);
  return mod?.meta.id === gameId || mod === null ? mod : undefined;
}
