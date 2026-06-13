// Client-side wrapper around Firebase Auth that hides SDK details from UI.
// Returns the raw ID token. UI components NEVER call firebase/auth directly.
'use client';

import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onIdTokenChanged,
  type User as FirebaseUser,
  type Unsubscribe,
} from 'firebase/auth';
import { getFirebaseAuth, getGoogleProvider, isFirebaseClientReady } from '@/lib/firebase/client';

function isInsideIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export const firebaseAuthService = {
  isConfigured(): boolean {
    return isFirebaseClientReady();
  },

  async signInWithGoogle(): Promise<{ idToken: string; firebaseUser: FirebaseUser } | 'redirected'> {
    if (!isFirebaseClientReady()) {
      throw new Error('Firebase is not configured. Use dev login or populate NEXT_PUBLIC_FIREBASE_* env vars.');
    }
    const auth = getFirebaseAuth();
    const provider = getGoogleProvider();

    if (isInsideIframe()) {
      await signInWithRedirect(auth, provider);
      return 'redirected';
    }
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken(true);
    return { idToken, firebaseUser: result.user };
  },

  async consumeRedirectResult(): Promise<{ idToken: string; firebaseUser: FirebaseUser } | null> {
    if (!isFirebaseClientReady()) return null;
    const auth = getFirebaseAuth();
    const result = await getRedirectResult(auth);
    if (!result) return null;
    const idToken = await result.user.getIdToken(true);
    return { idToken, firebaseUser: result.user };
  },

  async signOut(): Promise<void> {
    if (!isFirebaseClientReady()) return;
    await firebaseSignOut(getFirebaseAuth());
  },

  onIdTokenChanged(cb: (user: FirebaseUser | null) => void): Unsubscribe {
    if (!isFirebaseClientReady()) return () => undefined;
    return onIdTokenChanged(getFirebaseAuth(), cb);
  },
};
