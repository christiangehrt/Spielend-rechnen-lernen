export type RewardEventType =
  | 'GAME_COMPLETED'
  | 'GAME_WON'
  | 'STRATEGY_REVERSE_JUMP'
  | 'STRATEGY_EQUATION_BUILT'
  | 'STRATEGY_MULTI_SPLIT'
  | 'STRATEGY_TEN_BRIDGE'
  | 'STRATEGY_INTERVAL_SPLIT';

export type StrategyEventType = Extract<RewardEventType, `STRATEGY_${string}`>;

export interface PlacedSticker {
  instanceId: string;
  stickerId: string;
  sceneId: string;
  xPercent: number;
  yPercent: number;
  scale: number;
}

/** Stars granted for one finished round, with the reason for each star. */
export interface StarAward {
  total: number;
  events: RewardEventType[];
}
