import { randomInt, range } from '../../core/random/rng';
import { canMakeSum, findSubset } from '../../core/subsetSum';
import { PRESETS } from './presets';
import type { KlappenAction, KlappenPresetId, KlappenState } from './types';

export const createGame = (presetId: KlappenPresetId, seed: number): KlappenState => {
  const preset = PRESETS[presetId] ?? PRESETS.klappen9;
  return {
    preset,
    open: range(1, preset.maxFlap),
    dice: null,
    phase: 'roll',
    selected: [],
    lastClosed: [],
    rngSeed: seed,
    stats: { rolls: 0, multiSplits: 0 },
  };
};

const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);

export const target = (s: KlappenState) => (s.dice ? sum(s.dice) : 0);
export const selectedSum = (s: KlappenState) => sum(s.selected);
export const penalty = (s: KlappenState) => sum(s.open);

/** One die may be chosen once every flap above 6 is shut (or always for the 1-die mini preset). */
export const canUseOneDie = (s: KlappenState) => s.preset.fixedDice === 1 || s.open.every((v) => v <= 6);
export const mustUseOneDie = (s: KlappenState) => s.preset.fixedDice === 1;

export const hint = (s: KlappenState): number[] | null =>
  s.phase === 'select' ? findSubset(s.open.filter((v) => !s.selected.includes(v)), target(s) - selectedSum(s)) : null;

export const reduce = (s: KlappenState, a: KlappenAction): KlappenState => {
  switch (a.type) {
    case 'ROLL': {
      if (s.phase !== 'roll') return s;
      if (a.diceCount === 1 && !canUseOneDie(s)) return s;
      if (a.diceCount === 2 && mustUseOneDie(s)) return s;
      let seed = s.rngSeed;
      const dice: number[] = [];
      for (let i = 0; i < a.diceCount; i++) {
        const [d, ns] = randomInt(seed, 1, 6);
        dice.push(d);
        seed = ns;
      }
      const total = sum(dice);
      const possible = canMakeSum(s.open, total);
      return {
        ...s,
        dice,
        rngSeed: seed,
        selected: [],
        lastClosed: [],
        phase: possible ? 'select' : 'over',
        stats: { ...s.stats, rolls: s.stats.rolls + 1 },
      };
    }
    case 'TOGGLE': {
      if (s.phase !== 'select' || !s.open.includes(a.value)) return s;
      if (s.selected.includes(a.value)) return { ...s, selected: s.selected.filter((v) => v !== a.value) };
      if (selectedSum(s) + a.value > target(s)) return s;
      return { ...s, selected: [...s.selected, a.value] };
    }
    case 'CONFIRM': {
      if (s.phase !== 'select' || selectedSum(s) !== target(s)) return s;
      const open = s.open.filter((v) => !s.selected.includes(v));
      return {
        ...s,
        open,
        selected: [],
        lastClosed: s.selected,
        phase: open.length === 0 ? 'over' : 'roll',
        stats: { ...s.stats, multiSplits: s.stats.multiSplits + (s.selected.length >= 3 ? 1 : 0) },
      };
    }
    case 'UNDO': {
      // Only the not yet confirmed flap selection can be taken back.
      if (s.phase !== 'select' || s.selected.length === 0) return s;
      return { ...s, selected: s.selected.slice(0, -1) };
    }
    default:
      return s;
  }
};

export const canUndo = (s: KlappenState) => s.phase === 'select' && s.selected.length > 0;
