import { describe, expect, it } from 'vitest';
import { nextRandom, randomInt, range, shuffle } from './rng';

describe('rng', () => {
  it('is deterministic for the same seed', () => {
    expect(nextRandom(42)).toEqual(nextRandom(42));
    expect(shuffle(range(1, 20), 7)).toEqual(shuffle(range(1, 20), 7));
  });

  it('produces values in range', () => {
    let s = 1;
    for (let i = 0; i < 1000; i++) {
      const [v, ns] = randomInt(s, 1, 6);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      s = ns;
    }
  });

  it('shuffle keeps all items', () => {
    const [out] = shuffle(range(2, 19), 123);
    expect([...out].sort((a, b) => a - b)).toEqual(range(2, 19));
  });
});
