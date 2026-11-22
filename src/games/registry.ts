import type { GameMeta, GameModule } from '../core/types/game';
import { meta as raufRunter } from './rauf-runter/meta';
import { meta as klappenZu } from './klappen-zu/meta';
import { meta as verliebteZahlen } from './verliebte-zahlen/meta';
import { meta as zahlenstrahlHuepfen } from './zahlenstrahl-huepfen/meta';
import { meta as zahlenDetektiv } from './zahlen-detektiv/meta';

export interface RegistryEntry {
  meta: GameMeta;
  /** Lazy module loader; undefined while the module is not built yet (later roadmap phase). */
  load?: () => Promise<{ default: GameModule }>;
}

const planned = (meta: GameMeta): RegistryEntry => ({ meta });

/** Central registration of all 9 modules (order = hub order). */
export const GAMES: RegistryEntry[] = [
  { meta: raufRunter, load: () => import('./rauf-runter') },
  planned({
    id: 'raupen-reihen',
    title: 'Raupen-Reihen',
    art: 'game.raupen-reihen',
    color: '#7cb342',
    learningGoals: ['vergleichen', 'zahlenstrahl'],
    intro: 'Raupen-Reihen kommt bald.',
    phase: 3,
  }),
  planned({
    id: 'nachbar-reihe',
    title: 'Nachbar-Reihe',
    art: 'game.nachbar-reihe',
    color: '#ef476f',
    learningGoals: ['zahlenstrahl', 'vergleichen'],
    intro: 'Nachbar-Reihe kommt bald.',
    phase: 3,
  }),
  { meta: klappenZu },
  planned({
    id: 'schlummer-schloss',
    title: 'Schlummer-Schloss',
    art: 'game.schlummer-schloss',
    color: '#7b5cd6',
    learningGoals: ['addition'],
    intro: 'Schlummer-Schloss kommt bald.',
    phase: 3,
  }),
  planned({
    id: 'blitz-fuenf',
    title: 'Blitz-Fünf',
    art: 'game.blitz-fuenf',
    color: '#f4b400',
    learningGoals: ['blitzblick', 'zerlegung'],
    intro: 'Blitz-Fünf kommt bald.',
    phase: 3,
  }),
  { meta: verliebteZahlen },
  { meta: zahlenstrahlHuepfen },
  { meta: zahlenDetektiv },
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
