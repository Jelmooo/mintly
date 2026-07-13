import {
  createContext, useContext, useEffect, useRef, useState, type ReactNode,
} from 'react';
import {
  GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut as fbSignOut, type User,
} from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import type { AppState } from './types';
import { seedState } from './seed';
import { firebaseEnabled, getFirebase } from './firebase';

const STORAGE_KEY = 'allot.budget.v2';
const ONB_KEY = 'allot.onboarded.v1';

type Updater = Partial<AppState> | ((s: AppState) => AppState);

interface Store {
  state: AppState;
  update: (u: Updater) => void;
  reset: () => void;
  onboarded: boolean;
  setOnboarded: (v: boolean) => void;
  /** Firebase configured → cloud sync + login flow active. */
  cloud: boolean;
  user: User | null;
  authLoading: boolean;
  /** Waiting for the first Firestore snapshot after login. */
  syncing: boolean;
  authError: string | null;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const StoreContext = createContext<Store | null>(null);

function loadLocal(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...seedState, ...(JSON.parse(raw) as AppState) };
  } catch { /* fall through */ }
  return seedState;
}
function loadLocalOnb(): boolean {
  try { return !!localStorage.getItem(ONB_KEY); } catch { return false; }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const cloud = firebaseEnabled;
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(cloud);
  const [syncing, setSyncing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [state, setState] = useState<AppState>(cloud ? seedState : loadLocal);
  const [onboarded, setOnboardedState] = useState<boolean>(cloud ? false : loadLocalOnb());

  const stateRef = useRef(state);
  stateRef.current = state;
  const onbRef = useRef(onboarded);
  onbRef.current = onboarded;
  const writeTimer = useRef<number | undefined>(undefined);
  const uidRef = useRef<string | null>(null);

  // ----- local-only mode: persist to localStorage -----
  useEffect(() => {
    if (cloud) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state, cloud]);
  useEffect(() => {
    if (cloud) return;
    try {
      if (onboarded) localStorage.setItem(ONB_KEY, '1');
      else localStorage.removeItem(ONB_KEY);
    } catch { /* ignore */ }
  }, [onboarded, cloud]);

  // ----- cloud mode: debounced write of the whole document -----
  function scheduleWrite() {
    if (!cloud) return;
    window.clearTimeout(writeTimer.current);
    writeTimer.current = window.setTimeout(() => {
      const fb = getFirebase();
      const uid = uidRef.current;
      if (!fb || !uid) return;
      // JSON round-trip strips `undefined` values, which Firestore rejects.
      const payload = JSON.parse(
        JSON.stringify({ state: stateRef.current, onboarded: onbRef.current }),
      );
      setDoc(doc(fb.db, 'users', uid), { ...payload, updatedAt: serverTimestamp() })
        .catch((e) => console.error('Firestore write failed', e));
    }, 700);
  }

  // ----- auth listener -----
  useEffect(() => {
    if (!cloud) return;
    const fb = getFirebase()!;
    return onAuthStateChanged(fb.auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
  }, [cloud]);

  // ----- per-user document subscription -----
  useEffect(() => {
    if (!cloud || !user) {
      uidRef.current = null;
      return;
    }
    uidRef.current = user.uid;
    setSyncing(true);
    const fb = getFirebase()!;
    const ref = doc(fb.db, 'users', user.uid);
    let first = true;
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.metadata.hasPendingWrites) { setSyncing(false); return; } // own write echo
        if (snap.exists()) {
          const d = snap.data() as { state?: AppState; onboarded?: boolean };
          if (d.state) setState({ ...seedState, ...d.state });
          setOnboardedState(!!d.onboarded);
        } else if (first) {
          // First login ever: migrate whatever this device already had.
          const migrated = loadLocal();
          const migOnb = loadLocalOnb();
          setState(migrated);
          setOnboardedState(migOnb);
          const payload = JSON.parse(JSON.stringify({ state: migrated, onboarded: migOnb }));
          setDoc(ref, { ...payload, updatedAt: serverTimestamp() })
            .catch((e) => console.error('Firestore migrate failed', e));
        }
        first = false;
        setSyncing(false);
      },
      (err) => {
        console.error('Firestore subscribe failed', err);
        setAuthError(err.message);
        setSyncing(false);
      },
    );
    return unsub;
  }, [cloud, user]);

  const store: Store = {
    state,
    update: (u) => {
      setState((s) => (typeof u === 'function' ? u(s) : { ...s, ...u }));
      scheduleWrite();
    },
    reset: () => {
      setState(seedState);
      setOnboardedState(false);
      scheduleWrite();
    },
    onboarded,
    setOnboarded: (v) => {
      setOnboardedState(v);
      scheduleWrite();
    },
    cloud,
    user,
    authLoading,
    syncing,
    authError,
    signIn: async () => {
      try {
        const fb = getFirebase()!;
        setAuthError(null);
        await signInWithPopup(fb.auth, new GoogleAuthProvider());
      } catch (e) {
        setAuthError(e instanceof Error ? e.message : String(e));
      }
    },
    signOutUser: async () => {
      const fb = getFirebase();
      if (fb) await fbSignOut(fb.auth);
      setState(seedState);
      setOnboardedState(false);
    },
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore used outside StoreProvider');
  return ctx;
}
