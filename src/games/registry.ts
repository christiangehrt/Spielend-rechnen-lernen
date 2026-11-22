import type { GameMeta, GameModule } from '../core/types/game';
import { meta as raufRunter } from './rauf-runter/meta';
import { meta as raupenReihen } from './raupen-reihen/meta';
import { meta as nachbarReihe } from './nachbar-reihe/meta';
import { meta as blitzFuenf } from './blitz-fuenf/meta';
import { meta as schlummerSchloss } from './schlummer-schloss/meta';
import { meta as klappenZu } from './klappen-zu/meta';
import { meta as verliebteZahlen } from './verliebte-zahlen/meta';
import { meta as zahlenstrahlHuepfen } from './zahlenstrahl-huepfen/meta';
import { meta as zahlenDetektiv } from './zahlen-detektiv/meta';

export interface RegistryEntry {
  meta: GameMeta;
  /** Lazy module loader (code-split chunk); an entry without loader shows a locked "coming soon" tile. */
  load?: () => Promise<{ default: GameModule }>;
}

/** Central registration of all 9 modules (order = hub order). */
export const GAMES: RegistryEntry[] = [
  { meta: raufRunter, load: () => import('./rauf-runter') },
  { meta: raupenReihen, load: () => import('./raupen-reihen') },
  { meta: nachbarReihe, load: () => import('./nachbar-reihe') },
  { meta: klappenZu, load: () => import('./klappen-zu') },
  { meta: schlummerSchloss, load: () => import('./schlummer-schloss') },
  { meta: blitzFuenf, load: () => import('./blitz-fuenf') },
  { meta: verliebteZahlen, load: () => import('./verliebte-zahlen') },
  { meta: zahlenstrahlHuepfen, load: () => import('./zahlenstrahl-huepfen') },
  { meta: zahlenDetektiv, load: () => import('./zahlen-detektiv') },
];

export const getEntry = (id: string) => GAMES.find((g) => g.meta.id === id);

const cache = new Map<string, GameModule>();

export const loadModule = async (id: string): Promise<GameModule | null> => {
  const cached = cache.get(id);
  if (cached) return cached;
  const entry = getEntry(id);
  if (!entry?.load) return null;
  const mod = (await entry.load()).default;
  cache.set(id, mod);
  return mod;
};

export const getLoadedModule = (id: string) => cache.get(id) ?? null;
