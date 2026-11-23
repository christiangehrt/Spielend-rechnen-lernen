import type { BotLevel } from '../bots/bots';
import type { RecentRound } from '../types/profile';

export const BOT_ORDER: BotLevel[] = ['anfaenger', 'mittel', 'clever'];
/** Rounds in a row on the same level that trigger a recommendation. */
export const STREAK = 3;

export interface LevelChoice {
  presetId: string;
  botLevel?: BotLevel;
}

export interface Recommendation extends LevelChoice {
  change: 'up' | 'down' | null;
  /** What was adapted: the game preset (solo games) or the robot strength (games against bots). */
  axis: 'preset' | 'bot';
}

/**
 * "Mitwachsende Schwierigkeit": three well-played rounds in a row on the same
 * level recommend the next level, three difficult rounds the previous one.
 * Solo games adapt the preset (presets are listed easy → hard), games
 * against robots adapt the robot strength.
 */
export const recommend = (
  presetOrder: string[],
  recent: RecentRound[],
  current: LevelChoice,
  withBots: boolean,
): Recommendation => {
  const axis = withBots ? 'bot' : 'preset';
  const order: string[] = withBots ? BOT_ORDER : presetOrder;
  const level = withBots ? (current.botLevel ?? 'anfaenger') : current.presetId;
  const same = recent.filter((r) => r.preset === current.presetId && (!withBots || (r.bot ?? 'anfaenger') === level));
  const lastRounds = same.slice(-STREAK);
  const index = order.indexOf(level);
  let target = level;
  let change: Recommendation['change'] = null;
  if (lastRounds.length === STREAK && index >= 0) {
    if (lastRounds.every((r) => r.mastered) && index < order.length - 1) {
      target = order[index + 1];
      change = 'up';
    } else if (lastRounds.every((r) => !r.mastered) && index > 0) {
      target = order[index - 1];
      change = 'down';
    }
  }
  return withBots
    ? { presetId: current.presetId, botLevel: target as BotLevel, change, axis }
    : { presetId: target, botLevel: current.botLevel, change, axis };
};
