import { describe, expect, it } from 'vitest';
import { canMakeSum, findSubset } from './subsetSum';

describe('subset sum', () => {
  it('detects formable sums', () => {
    expect(canMakeSum([1, 2, 3, 4, 5, 6, 7, 8, 9], 12)).toBe(true);
    expect(canMakeSum([2, 4, 6], 5)).toBe(false);
    expect(canMakeSum([2, 4, 6], 10)).toBe(true);
    expect(canMakeSum([], 0)).toBe(true);
    expect(canMakeSum([9], 3)).toBe(false);
  });
  it('finds a subset with big numbers first', () => {
    expect(findSubset([1, 2, 3, 4, 9], 10)).toEqual([9, 1]);
    expect(findSubset([2, 4, 6], 5)).toBeNull();
    expect(findSubset([5, 5, 3], 10)).toEqual([5, 5]);
    expect(findSubset([1, 2, 3, 4], 10, 2)).toBeNull();
  });
});
