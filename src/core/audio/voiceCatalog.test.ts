import { describe, expect, it } from 'vitest';
import { PHRASES } from './phrases';
import { buildVoiceCatalog } from './voiceCatalog';

describe('voice catalogue', () => {
  const games = [{ id: 'g1', title: 'Spiel', art: '', color: '', learningGoals: [], intro: 'Erklärung', phase: 1 as const }];
  const catalog = buildVoiceCatalog(games);
  const items = catalog.flatMap((g) => g.items);

  it('covers numbers 0–100, every phrase used in games, titles and intros', () => {
    for (let n = 0; n <= 100; n++) expect(items.some((i) => i.key === `num_${n}`)).toBe(true);
    expect(items.some((i) => i.key === 'title_g1')).toBe(true);
    expect(items.find((i) => i.key === 'intro_g1')?.long).toBe(true);
  });

  it('only references existing phrases and has no duplicates', () => {
    const keys = items.map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const i of items) {
      if (/^(num|title|intro)_/.test(i.key)) continue;
      expect(PHRASES).toHaveProperty(i.key);
    }
  });
});
