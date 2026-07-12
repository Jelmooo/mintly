import {
  createContext, useContext, useEffect, useState, type ReactNode,
} from 'react';
import type { AppState } from './types';
import { seedState } from './seed';

const STORAGE_KEY = 'allot.budget.v2';
const ONB_KEY = 'allot.onboarded.v1';

type Updater = Partial<AppState> | ((s: AppState) => AppState);

interface Store {
  state: AppState;
  update: (u: Updater) => void;
  reset: () => void;
}

const StoreContext = createContext<Store | null>(null);

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...seedState, ...(JSON.parse(raw) as AppState) };
  } catch {
    /* fall through to seed */
  }
  return seedState;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  const store: Store = {
    state,
    update: (u) => setState((s) => (typeof u === 'function' ? u(s) : { ...s, ...u })),
    reset: () => setState(seedState),
  };
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore used outside StoreProvider');
  return ctx;
}

export const onboarding = {
  done: () => {
    try { return !!localStorage.getItem(ONB_KEY); } catch { return false; }
  },
  finish: () => { try { localStorage.setItem(ONB_KEY, '1'); } catch { /* ignore */ } },
  replay: () => { try { localStorage.removeItem(ONB_KEY); } catch { /* ignore */ } },
};
