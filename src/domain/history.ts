export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function createHistory<T>(initial: T): HistoryState<T> {
  return { past: [], present: initial, future: [] };
}

export function pushHistory<T>(state: HistoryState<T>, next: T): HistoryState<T> {
  return {
    past: [...state.past, state.present].slice(-80),
    present: next,
    future: [],
  };
}

export function undoHistory<T>(state: HistoryState<T>): HistoryState<T> {
  const previous = state.past.at(-1);
  if (!previous) return state;
  return {
    past: state.past.slice(0, -1),
    present: previous,
    future: [state.present, ...state.future],
  };
}

export function redoHistory<T>(state: HistoryState<T>): HistoryState<T> {
  const next = state.future[0];
  if (!next) return state;
  return {
    past: [...state.past, state.present],
    present: next,
    future: state.future.slice(1),
  };
}
