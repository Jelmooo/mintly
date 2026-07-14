import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { firebaseConfig } from './firebase-config';

/** Dev escape hatch: set localStorage "mintly.local" to force local-only mode. */
function forcedLocal(): boolean {
  try { return !!localStorage.getItem('mintly.local'); } catch { return false; }
}

/** True once a real config has been pasted into firebase-config.ts. */
export const firebaseEnabled =
  !!firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('PASTE') && !forcedLocal();

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function getFirebase(): { auth: Auth; db: Firestore } | null {
  if (!firebaseEnabled) return null;
  if (!app) {
    app = initializeApp(firebaseConfig);
    // Offline-persistent cache so the app keeps working without a connection
    // and syncs when it's back.
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
    auth = getAuth(app);
  }
  return { auth: auth!, db: db! };
}
