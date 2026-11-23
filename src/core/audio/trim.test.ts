import { describe, expect, it } from 'vitest';
import { findAudibleRange } from './trim';

describe('findAudibleRange', () => {
  it('cuts silence before and after the spoken word', () => {
    const sr = 1000;
    const s = new Float32Array(2000); // 2 s
    for (let i = 500; i < 1200; i++) s[i] = 0.5 * Math.sin(i);
    const r = findAudibleRange(s, sr, 0.03, 0.05);
    expect(r.start).toBeCloseTo(0.45, 1);
    expect(r.end).toBeCloseTo(1.25, 1);
  });

  it('keeps the whole clip when everything is silent', () => {
    expect(findAudibleRange(new Float32Array(1000), 1000)).toEqual({ start: 0, end: 1 });
  });
});
