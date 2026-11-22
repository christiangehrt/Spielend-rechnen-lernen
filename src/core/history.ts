/** Generic undo-stack helpers for reducers that keep their history in state. */
export interface WithHistory<S> {
  history: Omit<S, 'history'>[];
}

export const MAX_HISTORY = 30;

export const snapshot = <S extends WithHistory<S>>(state: S): Omit<S, 'history'> => {
  const { history: _ignored, ...rest } = state;
  return rest;
};

export const pushHistory = <S extends WithHistory<S>>(state: S): Omit<S, 'history'>[] =>
  [...state.history, snapshot(state)].slice(-MAX_HISTORY);

export const popHistory = <S extends WithHistory<S>>(state: S): S => {
  if (state.history.length === 0) return state;
  const previous = state.history[state.history.length - 1];
  return { ...(previous as S), history: state.history.slice(0, -1) };
};
