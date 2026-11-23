import { describe, expect, it } from 'vitest';
import {
  explainEquation,
  explainNeighbour,
  explainOverTen,
  explainOvershoot,
  explainPileMismatch,
  explainQuantity,
  explainTooFar,
} from './explain';

describe('explanatory feedback', () => {
  it('explains a wrong pile', () => {
    expect(explainPileMismatch(6, 9, 'asc')).toEqual([6, 'is', 'smaller', 9, 'only_bigger_here']);
    expect(explainPileMismatch(14, 12, 'desc')).toEqual([14, 'is', 'bigger', 12, 'only_smaller_here']);
    expect(explainPileMismatch(9, 9, 'asc')).toEqual(['same_number']);
  });
  it('explains overshooting sums', () => {
    expect(explainOvershoot(10, 8)).toEqual(['that_makes', 10, 'you_need_only', 8]);
    expect(explainOverTen([6, 7])).toEqual([6, 'and', 7, 'are', 13, 'more_than_ten']);
    expect(explainTooFar(3)).toEqual(['too_far', 'only_left', 3, 'jump_far']);
  });
  it('names the fitting neighbours', () => {
    expect(explainNeighbour(8, { min: 10, max: 13 }, 20)).toEqual([8, 'does_not_fit', 'only_fit', 9, 'and', 14]);
    expect(explainNeighbour(5, { min: 1, max: 13 }, 20)).toEqual([5, 'does_not_fit', 'only_fit', 14]);
    expect(explainNeighbour(5, null, 20)).toEqual(['starts_eleven']);
  });
  it('corrects equations', () => {
    expect(explainEquation([6, 2, 3])).toEqual([2, 'plus', 3, 'are', 5, 'not', 6]);
    expect(explainEquation([4, 3])).toEqual([3, 'and', 4, 'not_equal']);
  });
  it('uses the power of five and ten', () => {
    expect(explainQuantity(4)).toEqual([4]);
    expect(explainQuantity(7)).toEqual([5, 'and', 2, 'are', 7]);
    expect(explainQuantity(10)).toEqual([5, 'and', 5, 'are', 10]);
    expect(explainQuantity(13)).toEqual([10, 'and', 3, 'are', 13]);
  });
});
