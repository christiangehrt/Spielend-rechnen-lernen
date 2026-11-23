import { describe, expect, it } from 'vitest';
import type { RecentRound } from '../types/profile';
import { recommend } from './recommend';

const r = (preset: string, mastered: boolean, bot?: 'anfaenger' | 'mittel' | 'clever'): RecentRound => ({ preset, mastered, at: 0, ...(bot ? { bot } : {}) });
const presets = ['plus10', 'plus20', 'minus20', 'plus100'];

describe('recommend (growing difficulty)', () => {
  it('suggests the next preset after three mastered rounds', () => {
    const rec = recommend(presets, [r('plus10', true), r('plus10', true), r('plus10', true)], { presetId: 'plus10' }, false);
    expect(rec).toMatchObject({ presetId: 'plus20', change: 'up', axis: 'preset' });
  });

  it('suggests an easier preset after three difficult rounds', () => {
    const rec = recommend(presets, [r('plus20', false), r('plus20', false), r('plus20', false)], { presetId: 'plus20' }, false);
    expect(rec).toMatchObject({ presetId: 'plus10', change: 'down' });
  });

  it('stays put with mixed results, too few rounds or at the ends of the scale', () => {
    expect(recommend(presets, [r('plus20', true), r('plus20', false), r('plus20', true)], { presetId: 'plus20' }, false).change).toBeNull();
    expect(recommend(presets, [r('plus20', true), r('plus20', true)], { presetId: 'plus20' }, false).change).toBeNull();
    expect(recommend(presets, [r('plus100', true), r('plus100', true), r('plus100', true)], { presetId: 'plus100' }, false).change).toBeNull();
    expect(recommend(presets, [r('plus10', false), r('plus10', false), r('plus10', false)], { presetId: 'plus10' }, false).change).toBeNull();
  });

  it('only counts rounds on the current level', () => {
    const recent = [r('plus10', true), r('plus10', true), r('plus20', true), r('plus10', true)];
    expect(recommend(presets, recent, { presetId: 'plus10' }, false).change).toBe('up');
    expect(recommend(presets, recent, { presetId: 'plus20' }, false).change).toBeNull();
  });

  it('adapts the robot strength in games against bots', () => {
    const recent = [r('zr30', true, 'anfaenger'), r('zr30', true, 'anfaenger'), r('zr30', true, 'anfaenger')];
    expect(recommend(['zr30', 'original104'], recent, { presetId: 'zr30', botLevel: 'anfaenger' }, true)).toMatchObject({
      presetId: 'zr30',
      botLevel: 'mittel',
      change: 'up',
      axis: 'bot',
    });
  });
});
