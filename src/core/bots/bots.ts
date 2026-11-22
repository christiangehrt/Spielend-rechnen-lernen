import { useEffect, useRef } from 'react';

export type BotLevel = 'anfaenger' | 'mittel' | 'clever';

export const BOT_LEVELS: { id: BotLevel; art: string; speech: string }[] = [
  { id: 'anfaenger', art: 'level.junior', speech: 'Roboter: Anfänger' },
  { id: 'mittel', art: 'level.mittel', speech: 'Roboter: Mittel' },
  { id: 'clever', art: 'level.profi', speech: 'Roboter: Clever' },
];

export const BOT_NAMES = ['Robo', 'Bolt', 'Pixel'];
export const BOT_AVATARS = ['mode.bot', 'avatar.owl', 'avatar.penguin'];

/** Artificial thinking time (800–1500 ms) so a child can follow every bot move. */
export const thinkDelay = (random: number = Math.random()) => 800 + Math.round(random * 700);

/** Uniform random number in [min, max] plus a small jitter. */
export const jitter = (min: number, max: number, random: number = Math.random()) => min + random * (max - min);

/**
 * Runs `act` after a thinking delay whenever `active` is true. The timer is
 * cancelled when the dependencies change (e.g. state moved on, view closed).
 */
export function useBotTimer(active: boolean, act: () => void, deps: unknown[], delay?: number) {
  const actRef = useRef(act);
  actRef.current = act;
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => actRef.current(), delay ?? thinkDelay());
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, ...deps]);
}
