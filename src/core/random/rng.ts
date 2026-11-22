/**
 * Small seeded PRNG (mulberry32). Game reducers keep the seed in their state so
 * every random step (shuffles, dice) stays pure, replayable and resume-safe.
 */
export const nextRandom = (seed: number): [value: number, nextSeed: number] => {
  let t = (seed + 0x6d2b79f5) | 0;
  const nextSeed = t;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [value, nextSeed];
};

/** Integer in [min, max] (inclusive). */
export const randomInt = (seed: number, min: number, max: number): [number, number] => {
  const [v, s] = nextRandom(seed);
  return [min + Math.floor(v * (max - min + 1)), s];
};

export const shuffle = <T>(items: readonly T[], seed: number): [T[], number] => {
  const out = [...items];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    const [j, ns] = randomInt(s, 0, i);
    s = ns;
    [out[i], out[j]] = [out[j], out[i]];
  }
  return [out, s];
};

export const newSeed = (): number => (Math.random() * 2 ** 32) >>> 0;

export const range = (from: number, to: number): number[] =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
