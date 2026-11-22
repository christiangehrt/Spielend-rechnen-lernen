/** True if some subset of `values` (each used at most once) sums exactly to `target`. */
export const canMakeSum = (values: readonly number[], target: number): boolean => {
  if (target < 0) return false;
  let reachable = new Set<number>([0]);
  for (const v of values) {
    const next = new Set(reachable);
    for (const r of reachable) if (r + v <= target) next.add(r + v);
    reachable = next;
    if (reachable.has(target)) return true;
  }
  return reachable.has(target);
};

/**
 * One subset that sums to `target`, preferring big numbers first (a good
 * Shut-the-Box strategy and short hints). Returns null if impossible.
 */
export const findSubset = (values: readonly number[], target: number, maxSize = Infinity): number[] | null => {
  const sorted = [...values].sort((a, b) => b - a);
  const pick: number[] = [];
  const dfs = (start: number, rest: number): boolean => {
    if (rest === 0) return true;
    if (pick.length >= maxSize) return false;
    for (let i = start; i < sorted.length; i++) {
      if (sorted[i] > rest) continue;
      if (i > start && sorted[i] === sorted[i - 1]) continue;
      pick.push(sorted[i]);
      if (dfs(i + 1, rest - sorted[i])) return true;
      pick.pop();
    }
    return false;
  };
  return dfs(0, target) ? pick : null;
};
