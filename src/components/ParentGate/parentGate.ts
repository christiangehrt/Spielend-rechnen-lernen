/** In-memory flag: the parent area stays open for 10 minutes after the 3-second hold. */
let unlockedUntil = 0;
const WINDOW_MS = 10 * 60 * 1000;

export const unlockParentArea = () => {
  unlockedUntil = Date.now() + WINDOW_MS;
};
export const isParentAreaUnlocked = () => Date.now() < unlockedUntil;
export const lockParentArea = () => {
  unlockedUntil = 0;
};
